import { describe, test, expect } from 'bun:test'
import { ListMatchDecisions } from '../../src/usecases/list-match-decisions'
import {
	InMemoryMatchDecisionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makeDecision, makePerson } from './fixtures'

describe('ListMatchDecisions use case', () => {
	test('returns every decision recorded for the person', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-user' })
		let decisionA = makeDecision({
			id: 'd-1',
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-2',
			decision: 'accepted',
		})
		let decisionB = makeDecision({
			id: 'd-2',
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-3',
			decision: 'declined',
			declineReason: 'too far',
		})
		let unrelated = makeDecision({
			id: 'd-3',
			matchmakerId: 'mm-user',
			personId: 'p-99',
			candidateId: 'p-2',
		})
		let personRepo = new InMemoryPersonRepository([person])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository([decisionA, decisionB, unrelated])
		let usecase = new ListMatchDecisions({ personRepo, matchDecisionRepo })

		// Act
		let result = await usecase.execute({ matchmakerId: 'mm-user', personId: 'p-1' })

		// Assert
		assertOk(result)
		expect(result.data.map(d => d.id).sort()).toEqual(['d-1', 'd-2'])
	})

	test('returns not_found when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let usecase = new ListMatchDecisions({ personRepo, matchDecisionRepo })

		// Act
		let result = await usecase.execute({ matchmakerId: 'mm-user', personId: 'p-missing' })

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('not_found')
	})

	test('returns forbidden when the caller does not own the person', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([person])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let usecase = new ListMatchDecisions({ personRepo, matchDecisionRepo })

		// Act
		let result = await usecase.execute({ matchmakerId: 'mm-user', personId: 'p-1' })

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})
})
