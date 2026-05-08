import { describe, test, expect } from 'bun:test'
import { createFeedback, RepositoryError } from '@matchmaker/shared'
import { SupabaseFeedbackRepository } from '../../../src/adapters/supabase/supabase-feedback-repository'
import { createFakeSupabase } from './helpers'

let validFeedbackRow = {
	id: 'fb-111',
	introduction_id: 'intro-111',
	from_person_id: 'p-111',
	content: 'They got along well.',
	sentiment: 'positive',
	created_at: '2026-01-01T00:00:00.000Z',
}

describe('SupabaseFeedbackRepository.findById', () => {
	test('returns null when absent', async () => {
		let { client, calls } = createFakeSupabase({ data: null, error: null })
		let repo = new SupabaseFeedbackRepository(client)

		let result = await repo.findById('fb-missing')

		expect(result).toBeNull()
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['id', 'fb-missing'])
	})

	test('returns frozen Feedback entity', async () => {
		let { client } = createFakeSupabase({ data: validFeedbackRow, error: null })
		let repo = new SupabaseFeedbackRepository(client)

		let result = await repo.findById('fb-111')

		expect(result).not.toBeNull()
		expect(result?.id).toBe('fb-111')
		expect(result?.introductionId).toBe('intro-111')
		expect(result?.fromPersonId).toBe('p-111')
		expect(result?.sentiment).toBe('positive')
		expect(result?.createdAt).toBeInstanceOf(Date)
		expect(Object.isFrozen(result)).toBe(true)
	})

	test('throws RepositoryError on supabase error', async () => {
		let { client } = createFakeSupabase({
			data: null,
			error: { code: 'XX000', message: 'db down', details: '', hint: '', name: 'PostgrestError' },
		})
		let repo = new SupabaseFeedbackRepository(client)

		await expect(repo.findById('fb-1')).rejects.toBeInstanceOf(RepositoryError)
	})

	test('wraps invalid row as RepositoryError (not raw ZodError)', async () => {
		let { client } = createFakeSupabase({
			data: { ...validFeedbackRow, content: '' },
			error: null,
		})
		let repo = new SupabaseFeedbackRepository(client)

		await expect(repo.findById('fb-111')).rejects.toBeInstanceOf(RepositoryError)
		await expect(repo.findById('fb-111')).rejects.toMatchObject({ code: 'INVALID_ROW' })
	})
})

describe('SupabaseFeedbackRepository.findByIntroductionId', () => {
	test('returns array of frozen Feedback entities', async () => {
		let { client, calls } = createFakeSupabase({ data: [validFeedbackRow], error: null })
		let repo = new SupabaseFeedbackRepository(client)

		let result = await repo.findByIntroductionId('intro-111')

		expect(result).toHaveLength(1)
		expect(result[0]?.introductionId).toBe('intro-111')
		expect(Object.isFrozen(result[0])).toBe(true)
		let eqCall = calls.find(c => c.method === 'eq')
		expect(eqCall?.args).toEqual(['introduction_id', 'intro-111'])
	})

	test('returns empty array when no rows match', async () => {
		let { client } = createFakeSupabase({ data: [], error: null })
		let repo = new SupabaseFeedbackRepository(client)

		let result = await repo.findByIntroductionId('intro-empty')

		expect(result).toEqual([])
	})

	test('coerces a null sentiment column to null sentiment field', async () => {
		let { client } = createFakeSupabase({
			data: [{ ...validFeedbackRow, sentiment: null }],
			error: null,
		})
		let repo = new SupabaseFeedbackRepository(client)

		let result = await repo.findByIntroductionId('intro-111')

		expect(result[0]?.sentiment).toBeNull()
	})
})

describe('SupabaseFeedbackRepository.create', () => {
	test('inserts snake_case row and returns domain entity', async () => {
		let { client, calls } = createFakeSupabase({ data: validFeedbackRow, error: null })
		let repo = new SupabaseFeedbackRepository(client)
		let feedback = createFeedback({
			id: validFeedbackRow.id,
			introductionId: validFeedbackRow.introduction_id,
			fromPersonId: validFeedbackRow.from_person_id,
			content: validFeedbackRow.content,
			sentiment: validFeedbackRow.sentiment,
			createdAt: new Date(validFeedbackRow.created_at),
		})

		let result = await repo.create(feedback)

		expect(result.id).toBe('fb-111')
		expect(result.sentiment).toBe('positive')
		let insertCall = calls.find(c => c.method === 'insert')
		expect(insertCall).toBeDefined()
		let inserted = insertCall?.args[0]
		expect(inserted).toMatchObject({
			id: 'fb-111',
			introduction_id: 'intro-111',
			from_person_id: 'p-111',
			content: 'They got along well.',
			sentiment: 'positive',
		})
		expect(inserted).not.toHaveProperty('introductionId')
	})
})
