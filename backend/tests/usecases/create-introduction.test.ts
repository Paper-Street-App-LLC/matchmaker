import { describe, test, expect } from 'bun:test'
import { CreateIntroduction } from '../../src/usecases/create-introduction'
import {
	InMemoryIntroductionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import { FIXED_NOW, assertErr, assertOk, fixedClock, fixedIds, makePerson } from './fixtures'

let buildUsecase = (
	personRepo: InMemoryPersonRepository,
	introductionRepo: InMemoryIntroductionRepository,
	ids: readonly string[] = ['intro-generated'],
) =>
	new CreateIntroduction({
		personRepo,
		introductionRepo,
		clock: fixedClock(),
		ids: fixedIds(ids),
	})

describe('CreateIntroduction', () => {
	test('creates an introduction when caller owns person A only', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
			notes: 'both love hiking',
		})

		// Assert
		assertOk(result)
		expect(result.data.matchmakerAId).toBe('mm-user')
		expect(result.data.matchmakerBId).toBe('mm-other')
		expect(result.data.personAId).toBe('p-a')
		expect(result.data.personBId).toBe('p-b')
		expect(result.data.status).toBe('pending')
		expect(result.data.notes).toBe('both love hiking')
		let persisted = await introductionRepo.findById(result.data.id)
		expect(persisted).not.toBeNull()
	})

	test('creates an introduction when caller owns person B only', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-other' })
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
		})

		// Assert
		assertOk(result)
		expect(result.data.matchmakerAId).toBe('mm-other')
		expect(result.data.matchmakerBId).toBe('mm-user')
	})

	test('creates an introduction when caller owns both people', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
		})

		// Assert
		assertOk(result)
		expect(result.data.matchmakerAId).toBe('mm-user')
		expect(result.data.matchmakerBId).toBe('mm-user')
	})

	test('uses injected id generator and clock', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo, ['intro-fixed'])

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
		})

		// Assert
		assertOk(result)
		expect(result.data.id).toBe('intro-fixed')
		expect(result.data.createdAt.getTime()).toBe(FIXED_NOW.getTime())
		expect(result.data.updatedAt.getTime()).toBe(FIXED_NOW.getTime())
	})

	test('returns not_found when person A is missing', async () => {
		// Arrange
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
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

	test('returns not_found when person B is missing', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personA])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-missing',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('not_found')
	})

	test('returns forbidden when caller owns neither person and does not persist', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-other-1' })
		let personB = makePerson({ id: 'p-b', matchmakerId: 'mm-other-2' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
		expect(await introductionRepo.findByMatchmaker('mm-other-1')).toHaveLength(0)
		expect(await introductionRepo.findByMatchmaker('mm-other-2')).toHaveLength(0)
	})

	test('returns unprocessable when either person has no matchmaker', async () => {
		// Arrange
		let personA = makePerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = makePerson({ id: 'p-b', matchmakerId: null })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = buildUsecase(personRepo, introductionRepo)

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('unprocessable')
	})
})
