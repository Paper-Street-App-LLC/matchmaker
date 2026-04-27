import { describe, test, expect } from 'bun:test'
import { ListPeopleForMatchmaker } from '../../src/usecases/list-people-for-matchmaker'
import { InMemoryPersonRepository } from '../fakes/in-memory-repositories'
import { assertOk, makePerson } from './fixtures'

describe('ListPeopleForMatchmaker use case', () => {
	test('returns only the people owned by the caller', async () => {
		// Arrange
		let mine1 = makePerson({ id: 'p-1', matchmakerId: 'mm-user' })
		let mine2 = makePerson({ id: 'p-2', matchmakerId: 'mm-user' })
		let theirs = makePerson({ id: 'p-3', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([mine1, mine2, theirs])
		let usecase = new ListPeopleForMatchmaker({ personRepo })

		// Act
		let result = await usecase.execute({ matchmakerId: 'mm-user' })

		// Assert
		assertOk(result)
		expect(result.data).toHaveLength(2)
		expect(result.data.map(p => p.id).sort()).toEqual(['p-1', 'p-2'])
	})

	test('returns an empty array when the caller owns no people', async () => {
		// Arrange
		let theirs = makePerson({ id: 'p-1', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([theirs])
		let usecase = new ListPeopleForMatchmaker({ personRepo })

		// Act
		let result = await usecase.execute({ matchmakerId: 'mm-user' })

		// Assert
		assertOk(result)
		expect(result.data).toEqual([])
	})
})
