import { describe, test, expect } from 'bun:test'
import { UpdatePerson } from '../../src/usecases/update-person'
import { InMemoryPersonRepository } from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makePerson } from './fixtures'

describe('UpdatePerson use case', () => {
	test('updates a person owned by the caller', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-user', name: 'Old' })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new UpdatePerson({ personRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			patch: { name: 'New', location: 'Portland' },
		})

		// Assert
		assertOk(result)
		expect(result.data.name).toBe('New')
		expect(result.data.location).toBe('Portland')
		let saved = await personRepo.findById('p-1')
		expect(saved?.name).toBe('New')
	})

	test('returns not_found when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let usecase = new UpdatePerson({ personRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-missing',
			patch: { name: 'New' },
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('not_found')
		if (result.error.code === 'not_found') {
			expect(result.error.entity).toBe('person')
		}
	})

	test('returns forbidden when the caller does not own the person', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new UpdatePerson({ personRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			patch: { name: 'New' },
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
		let saved = await personRepo.findById('p-1')
		expect(saved?.name).toBe('Alex')
	})

	test('returns forbidden when the person has no matchmaker', async () => {
		// Arrange
		let person = makePerson({ id: 'p-1', matchmakerId: null })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new UpdatePerson({ personRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			patch: { name: 'New' },
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})
})
