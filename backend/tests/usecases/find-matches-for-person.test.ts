import { describe, test, expect } from 'bun:test'
import {
	FindMatchesForPerson,
	type MatchFinderFn,
	type MatchSuggestion,
} from '../../src/usecases/find-matches-for-person'
import {
	InMemoryMatchDecisionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makePerson } from './fixtures'

let sampleSuggestion = (id: string): MatchSuggestion => ({
	person: { id, name: `Name ${id}`, age: 30, location: null, gender: null },
	compatibility_score: 0.75,
	match_explanation: 'reason',
	is_cross_matchmaker: false,
})

describe('FindMatchesForPerson use case', () => {
	test('returns match suggestions after ownership passes', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([person])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let calls: Array<{ personId: string; matchmakerId: string }> = []
		let matchFinder: MatchFinderFn = async (personId, matchmakerId) => {
			calls.push({ personId, matchmakerId })
			return [sampleSuggestion('p-2'), sampleSuggestion('p-3')]
		}
		let usecase = new FindMatchesForPerson({ personRepo, matchDecisionRepo, matchFinder })

		// Act
		let result = await usecase.execute({ matchmakerId: 'mm-user', personId: 'p-1' })

		// Assert
		assertOk(result)
		expect(result.data.map(m => m.person.id)).toEqual(['p-2', 'p-3'])
		expect(calls).toEqual([{ personId: 'p-1', matchmakerId: 'mm-user' }])
	})

	test('returns not_found when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let matchFinder: MatchFinderFn = async () => {
			throw new Error('matchFinder should not be called')
		}
		let usecase = new FindMatchesForPerson({ personRepo, matchDecisionRepo, matchFinder })

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
		let matchFinder: MatchFinderFn = async () => {
			throw new Error('matchFinder should not be called')
		}
		let usecase = new FindMatchesForPerson({ personRepo, matchDecisionRepo, matchFinder })

		// Act
		let result = await usecase.execute({ matchmakerId: 'mm-user', personId: 'p-1' })

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})
})
