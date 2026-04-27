import { describe, test, expect } from 'bun:test'
import { CreatePerson } from '../../src/usecases/create-person'
import { InMemoryPersonRepository } from '../fakes/in-memory-repositories'
import { FIXED_NOW, assertErr, assertOk, fixedClock, fixedIds } from './fixtures'

describe('CreatePerson use case', () => {
	test('persists a new person owned by the caller and returns it', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let usecase = new CreatePerson({
			personRepo,
			clock: fixedClock(),
			ids: fixedIds(['generated-id']),
		})

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			name: 'Casey',
			age: 32,
			location: 'Seattle',
			gender: 'female',
			notes: 'met at rock gym',
		})

		// Assert
		assertOk(result)
		let person = result.data
		expect(person.id).toBe('generated-id')
		expect(person.matchmakerId).toBe('mm-user')
		expect(person.name).toBe('Casey')
		expect(person.age).toBe(32)
		expect(person.location).toBe('Seattle')
		expect(person.gender).toBe('female')
		expect(person.notes).toBe('met at rock gym')
		expect(person.active).toBe(true)
		expect(person.createdAt.getTime()).toBe(FIXED_NOW.getTime())
		expect(person.updatedAt.getTime()).toBe(FIXED_NOW.getTime())

		let saved = await personRepo.findById('generated-id')
		expect(saved).not.toBeNull()
		expect(saved?.matchmakerId).toBe('mm-user')
	})

	test('defaults optional fields to null when omitted', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let usecase = new CreatePerson({
			personRepo,
			clock: fixedClock(),
			ids: fixedIds(['generated-id']),
		})

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			name: 'Jamie',
		})

		// Assert
		assertOk(result)
		expect(result.data.age).toBeNull()
		expect(result.data.location).toBeNull()
		expect(result.data.gender).toBeNull()
		expect(result.data.notes).toBeNull()
		expect(result.data.preferences).toBeNull()
		expect(result.data.personality).toBeNull()
	})

	test('returns unprocessable when name is empty', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let usecase = new CreatePerson({
			personRepo,
			clock: fixedClock(),
			ids: fixedIds(['generated-id']),
		})

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			name: '',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('unprocessable')
		expect(await personRepo.findById('generated-id')).toBeNull()
	})

	test('returns unprocessable when age is below 18', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let usecase = new CreatePerson({
			personRepo,
			clock: fixedClock(),
			ids: fixedIds(['generated-id']),
		})

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			name: 'Too Young',
			age: 16,
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('unprocessable')
	})
})
