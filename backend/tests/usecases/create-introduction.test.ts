import { describe, test, expect } from 'bun:test'
import { CreateIntroduction } from '../../src/usecases/create-introduction'
import {
	InMemoryIntroductionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makePerson } from './fixtures'

describe('CreateIntroduction', () => {
	test('creates an introduction when caller owns one person', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new CreateIntroduction({ personRepo, introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
			notes: 'both love hiking',
		})

		// Assert
		assertOk(result)
		expect(result.data.personAId).toBe('p-a')
		expect(result.data.personBId).toBe('p-b')
		expect(result.data.notes).toBe('both love hiking')
	})

	test('translates missing person to not_found', async () => {
		// Arrange
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new CreateIntroduction({ personRepo, introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
			personAId: 'p-missing',
			personBId: 'p-b',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('not_found')
		if (result.error.code === 'not_found') {
			expect(result.error.entity).toBe('person')
		}
	})

	test('translates unauthorized caller to forbidden', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-a' })
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-b' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new CreateIntroduction({ personRepo, introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})

	test('translates unassigned matchmaker to unprocessable', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = makePerson({ id: 'p-b', matchmakerId: null })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new CreateIntroduction({ personRepo, introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('unprocessable')
	})
})
