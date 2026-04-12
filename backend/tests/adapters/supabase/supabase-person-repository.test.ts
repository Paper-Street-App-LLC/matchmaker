import { describe, test, expect } from 'bun:test'
import {
	createPerson,
	PersonNotFoundError,
	RepositoryConflictError,
	RepositoryError,
} from '@matchmaker/shared'
import { SupabasePersonRepository } from '../../../src/adapters/supabase/supabase-person-repository'
import { createFakeSupabase } from './helpers'

let createFake = createFakeSupabase

let validPersonRow = {
	id: '11111111-1111-1111-1111-111111111111',
	matchmaker_id: '22222222-2222-2222-2222-222222222222',
	name: 'Ada Lovelace',
	age: 36,
	location: 'London',
	gender: 'female',
	preferences: { likes: 'math' },
	personality: { traits: ['curious'] },
	notes: null,
	active: true,
	created_at: '2026-01-01T00:00:00.000Z',
	updated_at: '2026-01-02T00:00:00.000Z',
}

describe('SupabasePersonRepository.findById', () => {
	test('returns null when row is absent', async () => {
		let { client, calls } = createFake({ data: null, error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.findById('missing')

		expect(result).toBeNull()
		expect(calls.find(c => c.method === 'from')?.args[0]).toBe('people')
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['id', 'missing'])
	})

	test('parses row into frozen Person via createPerson', async () => {
		let { client } = createFake({ data: validPersonRow, error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.findById(validPersonRow.id)

		expect(result).not.toBeNull()
		expect(result?.id).toBe(validPersonRow.id)
		expect(result?.matchmakerId).toBe(validPersonRow.matchmaker_id)
		expect(result?.name).toBe('Ada Lovelace')
		expect(result?.createdAt).toBeInstanceOf(Date)
		expect(result?.updatedAt).toBeInstanceOf(Date)
		expect(Object.isFrozen(result)).toBe(true)
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFake({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabasePersonRepository(client)

		await expect(repo.findById('any')).rejects.toBeInstanceOf(RepositoryError)
	})

	test('wraps invalid row as RepositoryError (not raw ZodError)', async () => {
		let { client } = createFake({
			data: { ...validPersonRow, age: 'thirty-six' },
			error: null,
		})
		let repo = new SupabasePersonRepository(client)

		await expect(repo.findById(validPersonRow.id)).rejects.toBeInstanceOf(RepositoryError)
		await expect(repo.findById(validPersonRow.id)).rejects.toMatchObject({
			code: 'INVALID_ROW',
		})
	})
})

describe('SupabasePersonRepository.findByMatchmakerId', () => {
	test('returns empty array when no rows match', async () => {
		let { client } = createFake({ data: [], error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.findByMatchmakerId('mm-1')

		expect(result).toEqual([])
	})

	test('returns array of frozen Person entities', async () => {
		let rowB = { ...validPersonRow, id: '33333333-3333-3333-3333-333333333333', name: 'Grace Hopper' }
		let { client, calls } = createFake({ data: [validPersonRow, rowB], error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.findByMatchmakerId(validPersonRow.matchmaker_id)

		expect(result).toHaveLength(2)
		expect(result[0]?.name).toBe('Ada Lovelace')
		expect(result[1]?.name).toBe('Grace Hopper')
		expect(Object.isFrozen(result[0])).toBe(true)
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['matchmaker_id', validPersonRow.matchmaker_id])
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFake({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabasePersonRepository(client)

		await expect(repo.findByMatchmakerId('mm-1')).rejects.toBeInstanceOf(RepositoryError)
	})
})

describe('SupabasePersonRepository.findAllActive', () => {
	test('returns empty array when no rows match', async () => {
		let { client } = createFake({ data: [], error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.findAllActive()

		expect(result).toEqual([])
	})

	test('queries people filtered by active=true and returns frozen Person entities', async () => {
		let rowB = { ...validPersonRow, id: '33333333-3333-3333-3333-333333333333', name: 'Grace Hopper' }
		let { client, calls } = createFake({ data: [validPersonRow, rowB], error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.findAllActive()

		expect(result).toHaveLength(2)
		expect(result[0]?.name).toBe('Ada Lovelace')
		expect(result[1]?.name).toBe('Grace Hopper')
		expect(Object.isFrozen(result[0])).toBe(true)
		expect(calls.find(c => c.method === 'from')?.args[0]).toBe('people')
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['active', true])
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFake({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabasePersonRepository(client)

		await expect(repo.findAllActive()).rejects.toBeInstanceOf(RepositoryError)
	})
})

let buildPersonFromValidRow = () =>
	createPerson({
		id: validPersonRow.id,
		matchmakerId: validPersonRow.matchmaker_id,
		name: validPersonRow.name,
		age: validPersonRow.age,
		location: validPersonRow.location,
		gender: validPersonRow.gender,
		preferences: validPersonRow.preferences,
		personality: validPersonRow.personality,
		notes: validPersonRow.notes,
		active: validPersonRow.active,
		createdAt: new Date(validPersonRow.created_at),
		updatedAt: new Date(validPersonRow.updated_at),
	})

describe('SupabasePersonRepository.create', () => {
	test('inserts snake_case row and returns domain entity from returned row', async () => {
		let { client, calls } = createFake({ data: validPersonRow, error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.create(buildPersonFromValidRow())

		expect(result.id).toBe(validPersonRow.id)
		expect(result.name).toBe('Ada Lovelace')
		let insertCall = calls.find(c => c.method === 'insert')
		expect(insertCall).toBeDefined()
		let inserted = insertCall?.args[0]
		expect(inserted).toMatchObject({
			matchmaker_id: validPersonRow.matchmaker_id,
			name: 'Ada Lovelace',
		})
		expect(inserted).not.toHaveProperty('matchmakerId')
	})

	test('throws RepositoryConflictError on Postgres 23505', async () => {
		let { client } = createFake({
			data: null,
			error: {
				code: '23505',
				message: 'duplicate key',
				details: '',
				hint: '',
				name: 'PostgrestError',
			},
		})
		let repo = new SupabasePersonRepository(client)

		await expect(repo.create(buildPersonFromValidRow())).rejects.toBeInstanceOf(
			RepositoryConflictError,
		)
	})
})

describe('SupabasePersonRepository.update', () => {
	test('applies camelCase patch as snake_case update and returns updated entity', async () => {
		let updatedRow = { ...validPersonRow, name: 'Ada Byron' }
		let { client, calls } = createFake({ data: updatedRow, error: null })
		let repo = new SupabasePersonRepository(client)

		let result = await repo.update(validPersonRow.id, { name: 'Ada Byron' })

		expect(result.name).toBe('Ada Byron')
		let updateCall = calls.find(c => c.method === 'update')
		expect(updateCall?.args[0]).toEqual({ name: 'Ada Byron' })
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['id', validPersonRow.id])
		// Adapter must NOT leak ownership filter — single eq only
		let eqCalls = calls.filter(c => c.method === 'eq')
		expect(eqCalls).toHaveLength(1)
	})

	test('throws PersonNotFoundError when update returns no row', async () => {
		let { client } = createFake({ data: null, error: null })
		let repo = new SupabasePersonRepository(client)

		await expect(repo.update('missing', { name: 'x' })).rejects.toBeInstanceOf(PersonNotFoundError)
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFake({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabasePersonRepository(client)

		await expect(repo.update('id', { name: 'x' })).rejects.toBeInstanceOf(RepositoryError)
	})
})

describe('SupabasePersonRepository.delete', () => {
	test('soft-deletes by updating active=false and resolves void', async () => {
		let { client, calls } = createFake({
			data: { ...validPersonRow, active: false },
			error: null,
		})
		let repo = new SupabasePersonRepository(client)

		await expect(repo.delete(validPersonRow.id)).resolves.toBeUndefined()

		let updateCall = calls.find(c => c.method === 'update')
		expect(updateCall?.args[0]).toEqual({ active: false })
	})

	test('throws PersonNotFoundError when no row matches', async () => {
		let { client } = createFake({ data: null, error: null })
		let repo = new SupabasePersonRepository(client)

		await expect(repo.delete('missing')).rejects.toBeInstanceOf(PersonNotFoundError)
	})
})
