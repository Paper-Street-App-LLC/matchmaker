import { describe, test, expect } from 'bun:test'
import { z } from 'zod'
import {
	personResponseSchema,
	introductionResponseSchema,
	matchResponseSchema,
	feedbackResponseSchema,
	matchDecisionResponseSchema,
} from '../src/schemas'

let basePerson = {
	id: '550e8400-e29b-41d4-a716-446655440000',
	matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
	name: 'Alice',
	age: 28,
	location: 'New York',
	gender: 'female',
	preferences: { age_min: 25 },
	personality: { traits: ['kind'] },
	notes: null,
	active: true,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
}

let baseIntroduction = {
	id: '660e8400-e29b-41d4-a716-446655440001',
	matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
	person_a_id: '550e8400-e29b-41d4-a716-446655440000',
	person_b_id: '550e8400-e29b-41d4-a716-446655440002',
	status: 'pending',
	notes: null,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
}

let baseFeedback = {
	id: '770e8400-e29b-41d4-a716-446655440003',
	introduction_id: '660e8400-e29b-41d4-a716-446655440001',
	from_person_id: '550e8400-e29b-41d4-a716-446655440000',
	content: 'Great connection',
	sentiment: 'positive',
	created_at: '2026-01-01T00:00:00Z',
}

let baseMatchDecision = {
	id: '880e8400-e29b-41d4-a716-446655440004',
	matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
	person_id: '550e8400-e29b-41d4-a716-446655440000',
	candidate_id: '550e8400-e29b-41d4-a716-446655440002',
	decision: 'accepted' as const,
	decline_reason: null,
	created_at: '2026-01-01T00:00:00Z',
}

describe('personResponseSchema', () => {
	test('parses a canonical row', () => {
		expect(() => personResponseSchema.parse(basePerson)).not.toThrow()
	})

	test('preserves unknown server-side fields (looseObject behavior)', () => {
		let withExtras = { ...basePerson, extra_field: 'tolerated', server_only: 42 }
		let parsed = personResponseSchema.parse(withExtras)
		expect((parsed as Record<string, unknown>).extra_field).toBe('tolerated')
		expect((parsed as Record<string, unknown>).server_only).toBe(42)
	})

	test('accepts string-keyed preferences and personality records', () => {
		let parsed = personResponseSchema.parse({
			...basePerson,
			preferences: { foo: 'bar', nested: { ok: true } },
			personality: { traits: ['warm', 'curious'] },
		})
		expect(parsed.preferences).toEqual({ foo: 'bar', nested: { ok: true } })
	})

	test('rejects rows missing required fields with ZodError', () => {
		let { name: _, ...withoutName } = basePerson
		try {
			personResponseSchema.parse(withoutName)
			throw new Error('expected schema to throw')
		} catch (err) {
			expect(err).toBeInstanceOf(z.ZodError)
			expect((err as z.ZodError).issues).toBeDefined()
			expect((err as z.ZodError).issues.length).toBeGreaterThan(0)
		}
	})
})

describe('introductionResponseSchema', () => {
	test('parses a canonical row and preserves extras', () => {
		let parsed = introductionResponseSchema.parse({
			...baseIntroduction,
			tracking_id: 'abc',
		})
		expect((parsed as Record<string, unknown>).tracking_id).toBe('abc')
	})
})

describe('matchResponseSchema', () => {
	test('parses with optional nested person and preserves extras at both levels', () => {
		let parsed = matchResponseSchema.parse({
			person: {
				id: '550e8400-e29b-41d4-a716-446655440000',
				name: 'Alice',
				age: 28,
				location: 'New York',
				bio: 'tolerated extra on nested looseObject',
			},
			compatibility_score: 0.92,
			match_reasons: ['shared interests'],
			algorithm_version: 'v2',
		})
		expect((parsed as Record<string, unknown>).algorithm_version).toBe('v2')
		expect((parsed.person as Record<string, unknown>).bio).toBe(
			'tolerated extra on nested looseObject'
		)
	})

	test('parses when person is omitted', () => {
		expect(() =>
			matchResponseSchema.parse({
				compatibility_score: 0.5,
				match_reasons: ['proximity'],
			})
		).not.toThrow()
	})
})

describe('feedbackResponseSchema', () => {
	test('parses a canonical row', () => {
		expect(() => feedbackResponseSchema.parse(baseFeedback)).not.toThrow()
	})

	test('exposes ZodError.issues on invalid sentiment type', () => {
		try {
			feedbackResponseSchema.parse({ ...baseFeedback, sentiment: 42 })
			throw new Error('expected schema to throw')
		} catch (err) {
			expect(err).toBeInstanceOf(z.ZodError)
			let issues = (err as z.ZodError).issues
			expect(issues[0]?.path).toEqual(['sentiment'])
		}
	})
})

describe('matchDecisionResponseSchema', () => {
	test('parses accepted and declined decisions', () => {
		expect(() => matchDecisionResponseSchema.parse(baseMatchDecision)).not.toThrow()
		expect(() =>
			matchDecisionResponseSchema.parse({
				...baseMatchDecision,
				decision: 'declined',
				decline_reason: 'incompatible',
			})
		).not.toThrow()
	})

	test('rejects decisions outside the enum', () => {
		try {
			matchDecisionResponseSchema.parse({ ...baseMatchDecision, decision: 'maybe' })
			throw new Error('expected schema to throw')
		} catch (err) {
			expect(err).toBeInstanceOf(z.ZodError)
			expect((err as z.ZodError).issues[0]?.path).toEqual(['decision'])
		}
	})
})
