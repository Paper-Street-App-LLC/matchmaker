import { describe, test, expect } from 'bun:test'
import { createPerson } from '@matchmaker/shared'
import { createIntroduction } from '../../src/services/introductions'
import {
	InMemoryIntroductionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'

type ServiceResult = Awaited<ReturnType<typeof createIntroduction>>
type OkResult = Extract<ServiceResult, { error: null }>

function assertOk(result: ServiceResult): asserts result is OkResult {
	if (result.error !== null) {
		throw new Error(`expected ok result, got error: ${result.error.message}`)
	}
}

let now = new Date('2026-01-01T00:00:00.000Z')

let buildPerson = (overrides: { id: string; matchmakerId?: string | null }) =>
	createPerson({
		id: overrides.id,
		matchmakerId: overrides.matchmakerId ?? 'mm-1',
		name: `Person ${overrides.id}`,
		age: 30,
		location: null,
		gender: null,
		preferences: null,
		personality: null,
		notes: null,
		active: true,
		createdAt: now,
		updatedAt: now,
	})

describe('createIntroduction service', () => {
	test('creates introduction when user owns person A only', async () => {
		// Arrange
		let personA = buildPerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = buildPerson({ id: 'p-b', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-a',
			person_b_id: 'p-b',
			matchmakerId: 'mm-user',
		})

		// Assert
		assertOk(result)
		let intro = result.data
		expect(intro.matchmakerAId).toBe('mm-user')
		expect(intro.matchmakerBId).toBe('mm-other')
		expect(intro.personAId).toBe('p-a')
		expect(intro.personBId).toBe('p-b')
		expect(intro.status).toBe('pending')
		expect(intro.notes).toBeNull()
		let persisted = await introRepo.findById(intro.id)
		expect(persisted).not.toBeNull()
	})

	test('creates introduction when user owns person B only', async () => {
		// Arrange
		let personA = buildPerson({ id: 'p-a', matchmakerId: 'mm-other' })
		let personB = buildPerson({ id: 'p-b', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-a',
			person_b_id: 'p-b',
			matchmakerId: 'mm-user',
		})

		// Assert
		assertOk(result)
		expect(result.data.matchmakerAId).toBe('mm-other')
		expect(result.data.matchmakerBId).toBe('mm-user')
	})

	test('creates introduction when user owns both people', async () => {
		// Arrange
		let personA = buildPerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = buildPerson({ id: 'p-b', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-a',
			person_b_id: 'p-b',
			matchmakerId: 'mm-user',
		})

		// Assert
		assertOk(result)
		expect(result.data.matchmakerAId).toBe('mm-user')
		expect(result.data.matchmakerBId).toBe('mm-user')
	})

	test('passes notes through to the created introduction', async () => {
		// Arrange
		let personA = buildPerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = buildPerson({ id: 'p-b', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-a',
			person_b_id: 'p-b',
			notes: 'they both love climbing',
			matchmakerId: 'mm-user',
		})

		// Assert
		assertOk(result)
		expect(result.data.notes).toBe('they both love climbing')
	})

	test('returns 404 when person A is not found', async () => {
		// Arrange
		let personB = buildPerson({ id: 'p-b', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personB])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-missing',
			person_b_id: 'p-b',
			matchmakerId: 'mm-user',
		})

		// Assert
		expect(result.data).toBeNull()
		expect(result.error).toEqual({ message: 'Person A not found', status: 404 })
	})

	test('returns 404 when person B is not found', async () => {
		// Arrange
		let personA = buildPerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personRepo = new InMemoryPersonRepository([personA])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-a',
			person_b_id: 'p-missing',
			matchmakerId: 'mm-user',
		})

		// Assert
		expect(result.data).toBeNull()
		expect(result.error).toEqual({ message: 'Person B not found', status: 404 })
	})

	test('returns 403 when user owns neither person and does not persist', async () => {
		// Arrange
		let personA = buildPerson({ id: 'p-a', matchmakerId: 'mm-other-1' })
		let personB = buildPerson({ id: 'p-b', matchmakerId: 'mm-other-2' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-a',
			person_b_id: 'p-b',
			matchmakerId: 'mm-user',
		})

		// Assert
		expect(result.data).toBeNull()
		expect(result.error).toEqual({
			message: 'You must own at least one person in the introduction',
			status: 403,
		})
		expect(await introRepo.findByMatchmaker('mm-other-1')).toHaveLength(0)
		expect(await introRepo.findByMatchmaker('mm-other-2')).toHaveLength(0)
	})

	test('generates a non-empty id and sets createdAt === updatedAt', async () => {
		// Arrange
		let personA = buildPerson({ id: 'p-a', matchmakerId: 'mm-user' })
		let personB = buildPerson({ id: 'p-b', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([personA, personB])
		let introRepo = new InMemoryIntroductionRepository()

		// Act
		let result = await createIntroduction(personRepo, introRepo, {
			person_a_id: 'p-a',
			person_b_id: 'p-b',
			matchmakerId: 'mm-user',
		})

		// Assert
		assertOk(result)
		let intro = result.data
		expect(typeof intro.id).toBe('string')
		expect(intro.id.length).toBeGreaterThan(0)
		expect(intro.createdAt.getTime()).toBe(intro.updatedAt.getTime())
	})
})
