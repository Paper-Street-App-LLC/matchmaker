import { describe, test, expect } from 'bun:test'
import {
	createIntroduction,
	IntroductionNotFoundError,
	RepositoryConflictError,
	RepositoryError,
} from '@matchmaker/shared'
import { SupabaseIntroductionRepository } from '../../../src/adapters/supabase/supabase-introduction-repository'
import { createFakeSupabase } from './helpers'

let validIntroRow = {
	id: 'aaa-111',
	person_a_id: 'a1a1-111',
	person_b_id: 'b2b2-222',
	matchmaker_a_id: 'aa-111',
	matchmaker_b_id: 'bb-222',
	status: 'pending',
	notes: null,
	created_at: '2026-01-01T00:00:00.000Z',
	updated_at: '2026-01-02T00:00:00.000Z',
}

describe('SupabaseIntroductionRepository.findById', () => {
	test('returns null when row is absent', async () => {
		let { client, calls } = createFakeSupabase({ data: null, error: null })
		let repo = new SupabaseIntroductionRepository(client)

		let result = await repo.findById('missing')

		expect(result).toBeNull()
		expect(calls.find(c => c.method === 'from')?.args[0]).toBe('introductions')
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['id', 'missing'])
		// No ownership filter — single eq only
		expect(calls.filter(c => c.method === 'eq')).toHaveLength(1)
	})

	test('parses row into frozen Introduction', async () => {
		let { client } = createFakeSupabase({ data: validIntroRow, error: null })
		let repo = new SupabaseIntroductionRepository(client)

		let result = await repo.findById(validIntroRow.id)

		expect(result).not.toBeNull()
		expect(result?.id).toBe(validIntroRow.id)
		expect(result?.matchmakerAId).toBe('aa-111')
		expect(result?.matchmakerBId).toBe('bb-222')
		expect(result?.personAId).toBe('a1a1-111')
		expect(result?.personBId).toBe('b2b2-222')
		expect(result?.status).toBe('pending')
		expect(result?.createdAt).toBeInstanceOf(Date)
		expect(Object.isFrozen(result)).toBe(true)
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFakeSupabase({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabaseIntroductionRepository(client)

		await expect(repo.findById('any')).rejects.toBeInstanceOf(RepositoryError)
	})

	test('wraps invalid row as RepositoryError (not raw ZodError)', async () => {
		let { client } = createFakeSupabase({
			data: { ...validIntroRow, status: 'INVALID_STATUS' },
			error: null,
		})
		let repo = new SupabaseIntroductionRepository(client)

		await expect(repo.findById(validIntroRow.id)).rejects.toBeInstanceOf(RepositoryError)
		await expect(repo.findById(validIntroRow.id)).rejects.toMatchObject({
			code: 'INVALID_ROW',
		})
	})
})

describe('SupabaseIntroductionRepository.findByMatchmaker', () => {
	test('passes correct .or() string for matchmaker_a_id/matchmaker_b_id', async () => {
		let { client, calls } = createFakeSupabase({ data: [validIntroRow], error: null })
		let repo = new SupabaseIntroductionRepository(client)

		let result = await repo.findByMatchmaker('aa-111')

		expect(result).toHaveLength(1)
		expect(result[0]?.matchmakerAId).toBe('aa-111')
		let orCall = calls.find(c => c.method === 'or')
		expect(orCall?.args[0]).toBe('matchmaker_a_id.eq.aa-111,matchmaker_b_id.eq.aa-111')
	})

	test('rejects matchmakerId containing PostgREST filter syntax', async () => {
		let { client, calls } = createFakeSupabase({ data: [], error: null })
		let repo = new SupabaseIntroductionRepository(client)

		let malicious = 'x]],person_a_id.eq.target-id,matchmaker_a_id.eq.[x'
		await expect(repo.findByMatchmaker(malicious)).rejects.toBeInstanceOf(RepositoryError)
		await expect(repo.findByMatchmaker(malicious)).rejects.toMatchObject({
			code: 'INVALID_ARGUMENT',
		})
		// Must not reach the query at all
		expect(calls.filter(c => c.method === 'from')).toHaveLength(0)
	})

	test('rejects matchmakerId with embedded commas', async () => {
		let { client } = createFakeSupabase({ data: [], error: null })
		let repo = new SupabaseIntroductionRepository(client)

		await expect(
			repo.findByMatchmaker('aaa,matchmaker_b_id.eq.bbb'),
		).rejects.toBeInstanceOf(RepositoryError)
	})

	test('returns empty array when no rows match', async () => {
		let { client } = createFakeSupabase({ data: [], error: null })
		let repo = new SupabaseIntroductionRepository(client)

		let result = await repo.findByMatchmaker('dead-beef')

		expect(result).toEqual([])
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFakeSupabase({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabaseIntroductionRepository(client)

		await expect(repo.findByMatchmaker('aaa-bbb')).rejects.toBeInstanceOf(RepositoryError)
	})
})

describe('SupabaseIntroductionRepository.create', () => {
	test('inserts all four id columns in snake_case and returns domain entity', async () => {
		let { client, calls } = createFakeSupabase({ data: validIntroRow, error: null })
		let repo = new SupabaseIntroductionRepository(client)
		let intro = createIntroduction({
			id: validIntroRow.id,
			matchmakerAId: validIntroRow.matchmaker_a_id,
			matchmakerBId: validIntroRow.matchmaker_b_id,
			personAId: validIntroRow.person_a_id,
			personBId: validIntroRow.person_b_id,
			status: 'pending',
			notes: null,
			createdAt: new Date(validIntroRow.created_at),
			updatedAt: new Date(validIntroRow.updated_at),
		})

		let result = await repo.create(intro)

		expect(result.id).toBe(validIntroRow.id)
		let insertCall = calls.find(c => c.method === 'insert')
		expect(insertCall).toBeDefined()
		let inserted = insertCall?.args[0]
		expect(inserted).toMatchObject({
			person_a_id: 'a1a1-111',
			person_b_id: 'b2b2-222',
			matchmaker_a_id: 'aa-111',
			matchmaker_b_id: 'bb-222',
		})
		expect(inserted).not.toHaveProperty('matchmakerAId')
	})

	test('throws RepositoryConflictError on Postgres 23505', async () => {
		let { client } = createFakeSupabase({
			data: null,
			error: {
				code: '23505',
				message: 'duplicate key',
				details: '',
				hint: '',
				name: 'PostgrestError',
			},
		})
		let repo = new SupabaseIntroductionRepository(client)
		let intro = createIntroduction({
			id: validIntroRow.id,
			matchmakerAId: validIntroRow.matchmaker_a_id,
			matchmakerBId: validIntroRow.matchmaker_b_id,
			personAId: validIntroRow.person_a_id,
			personBId: validIntroRow.person_b_id,
			createdAt: new Date(validIntroRow.created_at),
			updatedAt: new Date(validIntroRow.updated_at),
		})

		await expect(repo.create(intro)).rejects.toBeInstanceOf(RepositoryConflictError)
	})
})

describe('SupabaseIntroductionRepository.update', () => {
	test('applies status/notes patch and returns updated entity', async () => {
		let updatedRow = { ...validIntroRow, status: 'accepted', notes: 'Great match!' }
		let { client, calls } = createFakeSupabase({ data: updatedRow, error: null })
		let repo = new SupabaseIntroductionRepository(client)

		let result = await repo.update(validIntroRow.id, {
			status: 'accepted',
			notes: 'Great match!',
		})

		expect(result.status).toBe('accepted')
		expect(result.notes).toBe('Great match!')
		let updateCall = calls.find(c => c.method === 'update')
		expect(updateCall?.args[0]).toEqual({ status: 'accepted', notes: 'Great match!' })
	})

	test('throws IntroductionNotFoundError when update returns no row', async () => {
		let { client } = createFakeSupabase({ data: null, error: null })
		let repo = new SupabaseIntroductionRepository(client)

		await expect(
			repo.update('missing', { status: 'declined' }),
		).rejects.toBeInstanceOf(IntroductionNotFoundError)
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFakeSupabase({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabaseIntroductionRepository(client)

		await expect(repo.update('id', { status: 'accepted' })).rejects.toBeInstanceOf(RepositoryError)
	})
})
