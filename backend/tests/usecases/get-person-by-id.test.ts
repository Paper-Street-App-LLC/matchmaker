import { describe, test, expect } from 'bun:test'
import { GetPersonById } from '../../src/usecases/get-person-by-id'
import { InMemoryPersonRepository } from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makePerson } from './fixtures'

describe('GetPersonById use case', () => {
	test('returns the person when it exists and is active', async () => {
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-user', name: 'Alex' })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new GetPersonById({ personRepo })

		let result = await usecase.execute({ personId: 'p-1' })

		assertOk(result)
		expect(result.data.id).toBe('p-1')
		expect(result.data.name).toBe('Alex')
	})

	test('returns the person regardless of which matchmaker owns it', async () => {
		// Cross-matchmaker visibility: any active candidate must be inspectable so
		// FindMatchesForPerson results stay drillable.
		let person = makePerson({ id: 'p-1', matchmakerId: 'mm-other' })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new GetPersonById({ personRepo })

		let result = await usecase.execute({ personId: 'p-1' })

		assertOk(result)
		expect(result.data.id).toBe('p-1')
		expect(result.data.matchmakerId).toBe('mm-other')
	})

	test('returns the person when it has no matchmaker (seed profile)', async () => {
		let person = makePerson({ id: 'p-1', matchmakerId: null })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new GetPersonById({ personRepo })

		let result = await usecase.execute({ personId: 'p-1' })

		assertOk(result)
		expect(result.data.matchmakerId).toBeNull()
	})

	test('returns not_found when the person does not exist', async () => {
		let personRepo = new InMemoryPersonRepository()
		let usecase = new GetPersonById({ personRepo })

		let result = await usecase.execute({ personId: 'p-missing' })

		assertErr(result)
		expect(result.error.code).toBe('not_found')
		if (result.error.code === 'not_found') {
			expect(result.error.entity).toBe('person')
		}
	})

	test('returns not_found when the person is soft-deleted (inactive)', async () => {
		let person = makePerson({ id: 'p-1', active: false })
		let personRepo = new InMemoryPersonRepository([person])
		let usecase = new GetPersonById({ personRepo })

		let result = await usecase.execute({ personId: 'p-1' })

		assertErr(result)
		expect(result.error.code).toBe('not_found')
	})
})
