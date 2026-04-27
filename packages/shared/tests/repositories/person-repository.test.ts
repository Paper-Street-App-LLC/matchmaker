import { describe, test, expect } from 'bun:test'
import type { IPersonRepository, PersonUpdate } from '../../src/repositories/person-repository'
import { createPerson, type Person } from '../../src/domain/person'

function buildPerson(overrides: Partial<{ id: string; name: string }> = {}): Person {
	return createPerson({
		id: overrides.id ?? 'person-1',
		name: overrides.name ?? 'Alice',
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-01T00:00:00Z'),
	})
}

function makeStub(): IPersonRepository {
	let store: Person[] = []
	return {
		async findById(id) {
			return store.find((p) => p.id === id) ?? null
		},
		async findByMatchmakerId(matchmakerId) {
			return store.filter((p) => p.matchmakerId === matchmakerId)
		},
		async findAllActive() {
			return store
		},
		async create(person) {
			store.push(person)
			return person
		},
		async update(_id, _patch) {
			return store[0]!
		},
		async delete(_id) {
			return
		},
	}
}

describe('IPersonRepository (contract)', () => {
	test('a stub conforming to the interface compiles and runs', async () => {
		let repo = makeStub()
		let person = buildPerson()

		let created = await repo.create(person)
		expect(created.id).toBe('person-1')

		let found = await repo.findById('person-1')
		expect(found?.id).toBe('person-1')

		let missing = await repo.findById('nope')
		expect(missing).toBeNull()

		let list = await repo.findByMatchmakerId('mm-1')
		expect(Array.isArray(list)).toBe(true)
	})

	test('PersonUpdate accepts a partial patch without identity or timestamp fields', () => {
		let patch: PersonUpdate = { name: 'Renamed', notes: 'updated' }
		expect(patch.name).toBe('Renamed')

		// @ts-expect-error — id must not appear in PersonUpdate
		let badId: PersonUpdate = { id: 'x' }
		expect(badId).toBeDefined()

		// @ts-expect-error — createdAt must not appear in PersonUpdate
		let badCreatedAt: PersonUpdate = { createdAt: new Date() }
		expect(badCreatedAt).toBeDefined()

		// @ts-expect-error — updatedAt is owned by the repository, not the caller
		let badUpdatedAt: PersonUpdate = { updatedAt: new Date() }
		expect(badUpdatedAt).toBeDefined()

		// @ts-expect-error — ownership reassignment is not a patch capability
		let badMatchmaker: PersonUpdate = { matchmakerId: 'mm-2' }
		expect(badMatchmaker).toBeDefined()
	})

	test('update returns a Promise<Person> and delete returns Promise<void>', async () => {
		let repo = makeStub()
		await repo.create(buildPerson())
		let updated: Person = await repo.update('person-1', { name: 'Renamed' })
		expect(updated).toBeDefined()
		let deleted: void = await repo.delete('person-1')
		expect(deleted).toBeUndefined()
	})
})
