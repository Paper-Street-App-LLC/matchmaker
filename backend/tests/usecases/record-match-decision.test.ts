import { describe, test, expect } from 'bun:test'
import { RecordMatchDecision } from '../../src/usecases/record-match-decision'
import {
	InMemoryMatchDecisionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import {
	FIXED_NOW,
	assertErr,
	assertOk,
	fixedClock,
	fixedIds,
	makeDecision,
	makePerson,
} from './fixtures'

let buildDeps = (
	people = [makePerson({ id: 'p-1', matchmakerId: 'mm-user' })],
	decisions: ReturnType<typeof makeDecision>[] = [],
) => {
	let personRepo = new InMemoryPersonRepository(people)
	let matchDecisionRepo = new InMemoryMatchDecisionRepository(decisions)
	return {
		personRepo,
		matchDecisionRepo,
		deps: {
			personRepo,
			matchDecisionRepo,
			clock: fixedClock(),
			ids: fixedIds(['generated-decision']),
		},
	}
}

describe('RecordMatchDecision use case', () => {
	test('records an accepted decision for the caller', async () => {
		// Arrange
		let { deps, matchDecisionRepo } = buildDeps()
		let usecase = new RecordMatchDecision(deps)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-2',
			decision: 'accepted',
		})

		// Assert
		assertOk(result)
		expect(result.data.id).toBe('generated-decision')
		expect(result.data.matchmakerId).toBe('mm-user')
		expect(result.data.personId).toBe('p-1')
		expect(result.data.candidateId).toBe('p-2')
		expect(result.data.decision).toBe('accepted')
		expect(result.data.declineReason).toBeNull()
		expect(result.data.createdAt.getTime()).toBe(FIXED_NOW.getTime())
		let stored = await matchDecisionRepo.findByCandidatePair('p-1', 'p-2')
		expect(stored).not.toBeNull()
	})

	test('records a declined decision with a reason', async () => {
		// Arrange
		let { deps } = buildDeps()
		let usecase = new RecordMatchDecision(deps)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-2',
			decision: 'declined',
			declineReason: 'different life stage',
		})

		// Assert
		assertOk(result)
		expect(result.data.decision).toBe('declined')
		expect(result.data.declineReason).toBe('different life stage')
	})

	test('returns not_found when the person does not exist', async () => {
		// Arrange
		let { deps } = buildDeps([])
		let usecase = new RecordMatchDecision(deps)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-missing',
			candidateId: 'p-2',
			decision: 'accepted',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('not_found')
	})

	test('returns forbidden when the caller does not own the person', async () => {
		// Arrange
		let { deps } = buildDeps([makePerson({ id: 'p-1', matchmakerId: 'mm-other' })])
		let usecase = new RecordMatchDecision(deps)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-2',
			decision: 'accepted',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})

	test('returns unprocessable when personId equals candidateId', async () => {
		// Arrange
		let { deps } = buildDeps()
		let usecase = new RecordMatchDecision(deps)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-1',
			decision: 'accepted',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('unprocessable')
	})

	test('returns conflict when a decision for the same pair already exists', async () => {
		// Arrange
		let existing = makeDecision({
			id: 'd-existing',
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-2',
		})
		let { deps } = buildDeps(
			[makePerson({ id: 'p-1', matchmakerId: 'mm-user' })],
			[existing],
		)
		let usecase = new RecordMatchDecision(deps)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-2',
			decision: 'accepted',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('conflict')
	})
})
