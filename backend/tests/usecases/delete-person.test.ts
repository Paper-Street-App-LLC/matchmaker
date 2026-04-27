import { describe, test, expect } from 'bun:test'
import { DeletePerson } from '../../src/usecases/delete-person'
import { InMemoryPersonRepository } from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makePerson } from './fixtures'

describe('DeletePerson use case', () => {
	test('soft-deletes a person owned by the caller', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new DeletePerson({ personRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
		})

		// Assert
		assertOk(result)
		expect(result.data.active).toBe(false)
		let saved = await personRepo.findById('p-1')
		expect(saved?.active).toBe(false)
	})

	test('returns not_found when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let usecase = new DeletePerson({ personRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-missing',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('not_found')
	})

	test('returns forbidden when the caller does not own the person', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new DeletePerson({ personRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
		let saved = await personRepo.findById('p-1')
		expect(saved?.active).toBe(true)
	})
})
