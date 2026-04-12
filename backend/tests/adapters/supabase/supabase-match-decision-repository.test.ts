import { describe, test, expect } from 'bun:test'
import {
	createMatchDecision,
	RepositoryConflictError,
	RepositoryError,
} from '@matchmaker/shared'
import { SupabaseMatchDecisionRepository } from '../../../src/adapters/supabase/supabase-match-decision-repository'
import { createFakeSupabase } from './helpers'

let validDecisionRow = {
	id: 'dec-111',
	matchmaker_id: 'mm-111',
	person_id: 'p-111',
	candidate_id: 'c-222',
	decision: 'declined',
	decline_reason: 'Not compatible',
	created_at: '2026-01-01T00:00:00.000Z',
}

describe('SupabaseMatchDecisionRepository.findByPerson', () => {
	test('returns array of frozen MatchDecision entities', async () => {
		let { client, calls } = createFakeSupabase({ data: [validDecisionRow], error: null })
		let repo = new SupabaseMatchDecisionRepository(client)

		let result = await repo.findByPerson('p-111')

		expect(result).toHaveLength(1)
		expect(result[0]?.personId).toBe('p-111')
		expect(result[0]?.decision).toBe('declined')
		expect(result[0]?.declineReason).toBe('Not compatible')
		expect(result[0]?.createdAt).toBeInstanceOf(Date)
		expect(Object.isFrozen(result[0])).toBe(true)
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['person_id', 'p-111'])
	})

	test('returns empty array when no rows match', async () => {
		let { client } = createFakeSupabase({ data: [], error: null })
		let repo = new SupabaseMatchDecisionRepository(client)

		let result = await repo.findByPerson('nobody')

		expect(result).toEqual([])
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFakeSupabase({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabaseMatchDecisionRepository(client)

		await expect(repo.findByPerson('any')).rejects.toBeInstanceOf(RepositoryError)
	})

	test('wraps invalid row as RepositoryError (not raw ZodError)', async () => {
		let { client } = createFakeSupabase({
			data: [{ ...validDecisionRow, decision: 'GARBAGE' }],
			error: null,
		})
		let repo = new SupabaseMatchDecisionRepository(client)

		await expect(repo.findByPerson('p-111')).rejects.toBeInstanceOf(RepositoryError)
		await expect(repo.findByPerson('p-111')).rejects.toMatchObject({
			code: 'INVALID_ROW',
		})
	})
})

describe('SupabaseMatchDecisionRepository.findByCandidatePair', () => {
	test('returns null when absent', async () => {
		let { client, calls } = createFakeSupabase({ data: null, error: null })
		let repo = new SupabaseMatchDecisionRepository(client)

		let result = await repo.findByCandidatePair('p-111', 'c-222')

		expect(result).toBeNull()
		let eqCalls = calls.filter(c => c.method === 'eq')
		expect(eqCalls).toHaveLength(2)
		expect(eqCalls[0]?.args).toEqual(['person_id', 'p-111'])
		expect(eqCalls[1]?.args).toEqual(['candidate_id', 'c-222'])
	})

	test('returns single frozen MatchDecision', async () => {
		let { client } = createFakeSupabase({ data: validDecisionRow, error: null })
		let repo = new SupabaseMatchDecisionRepository(client)

		let result = await repo.findByCandidatePair('p-111', 'c-222')

		expect(result).not.toBeNull()
		expect(result?.matchmakerId).toBe('mm-111')
		expect(result?.candidateId).toBe('c-222')
		expect(Object.isFrozen(result)).toBe(true)
	})
})

describe('SupabaseMatchDecisionRepository.create', () => {
	test('inserts snake_case row and returns domain entity', async () => {
		let { client, calls } = createFakeSupabase({ data: validDecisionRow, error: null })
		let repo = new SupabaseMatchDecisionRepository(client)
		let decision = createMatchDecision({
			id: validDecisionRow.id,
			matchmakerId: validDecisionRow.matchmaker_id,
			personId: validDecisionRow.person_id,
			candidateId: validDecisionRow.candidate_id,
			decision: 'declined',
			declineReason: validDecisionRow.decline_reason,
			createdAt: new Date(validDecisionRow.created_at),
		})

		let result = await repo.create(decision)

		expect(result.id).toBe(validDecisionRow.id)
		expect(result.decision).toBe('declined')
		let insertCall = calls.find(c => c.method === 'insert')
		expect(insertCall).toBeDefined()
		let inserted = insertCall?.args[0]
		expect(inserted).toMatchObject({
			matchmaker_id: 'mm-111',
			person_id: 'p-111',
			candidate_id: 'c-222',
			decision: 'declined',
			decline_reason: 'Not compatible',
		})
		expect(inserted).not.toHaveProperty('matchmakerId')
	})

	test('throws RepositoryConflictError on Postgres 23505', async () => {
		let { client } = createFakeSupabase({
			data: null,
			error: {
				code: '23505',
				message: 'duplicate key value violates unique constraint',
				details: '',
				hint: '',
				name: 'PostgrestError',
			},
		})
		let repo = new SupabaseMatchDecisionRepository(client)
		let decision = createMatchDecision({
			id: validDecisionRow.id,
			matchmakerId: validDecisionRow.matchmaker_id,
			personId: validDecisionRow.person_id,
			candidateId: validDecisionRow.candidate_id,
			decision: 'declined',
			declineReason: 'Not compatible',
			createdAt: new Date(validDecisionRow.created_at),
		})

		await expect(repo.create(decision)).rejects.toBeInstanceOf(RepositoryConflictError)
	})
})
