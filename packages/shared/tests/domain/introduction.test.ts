import { describe, test, expect } from 'bun:test'
import {
	createIntroduction,
	InvalidIntroductionError,
	type IntroductionInput,
	type IntroductionStatus,
} from '../../src/domain/introduction'
import { DomainError } from '../../src/domain/errors'

function baseInput(overrides: Partial<IntroductionInput> = {}): IntroductionInput {
	return {
		id: 'intro-1',
		matchmakerAId: 'mm-a',
		matchmakerBId: 'mm-b',
		personAId: 'person-a',
		personBId: 'person-b',
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-01T00:00:00Z'),
		...overrides,
	}
}

describe('createIntroduction', () => {
	describe('happy path', () => {
		test('returns a frozen Introduction with all fields populated', () => {
			let result = createIntroduction({
				id: 'intro-1',
				matchmakerAId: 'mm-a',
				matchmakerBId: 'mm-b',
				personAId: 'person-a',
				personBId: 'person-b',
				status: 'dating',
				notes: 'hit it off at coffee',
				createdAt: new Date('2026-01-01T00:00:00Z'),
				updatedAt: new Date('2026-01-03T00:00:00Z'),
			})

			expect(result.id).toBe('intro-1')
			expect(result.status).toBe('dating')
			expect(result.notes).toBe('hit it off at coffee')
			expect(Object.isFrozen(result)).toBe(true)
		})

		test('defaults status to pending when omitted', () => {
			let result = createIntroduction(baseInput())
			expect(result.status).toBe('pending')
		})

		test('accepts all five valid status literals', () => {
			let statuses: IntroductionStatus[] = [
				'pending',
				'accepted',
				'declined',
				'dating',
				'ended',
			]
			for (let s of statuses) {
				let result = createIntroduction(baseInput({ status: s }))
				expect(result.status).toBe(s)
			}
		})

		test('normalizes omitted notes to null', () => {
			let result = createIntroduction(baseInput())
			expect(result.notes).toBeNull()
		})

		test('allows matchmakerAId to equal matchmakerBId', () => {
			let result = createIntroduction(
				baseInput({ matchmakerAId: 'mm-same', matchmakerBId: 'mm-same' }),
			)
			expect(result.matchmakerAId).toBe('mm-same')
			expect(result.matchmakerBId).toBe('mm-same')
		})
	})

	describe('id invariants', () => {
		test('throws InvalidIntroductionError when id is empty', () => {
			expect(() => createIntroduction(baseInput({ id: '' }))).toThrow(InvalidIntroductionError)
		})

		test('throws InvalidIntroductionError when matchmakerAId is empty', () => {
			expect(() => createIntroduction(baseInput({ matchmakerAId: '' }))).toThrow(
				InvalidIntroductionError,
			)
		})

		test('throws InvalidIntroductionError when matchmakerBId is empty', () => {
			expect(() => createIntroduction(baseInput({ matchmakerBId: '' }))).toThrow(
				InvalidIntroductionError,
			)
		})

		test('throws InvalidIntroductionError when personAId is empty', () => {
			expect(() => createIntroduction(baseInput({ personAId: '' }))).toThrow(
				InvalidIntroductionError,
			)
		})

		test('throws InvalidIntroductionError when personBId is empty', () => {
			expect(() => createIntroduction(baseInput({ personBId: '' }))).toThrow(
				InvalidIntroductionError,
			)
		})
	})

	describe('self-introduction invariant', () => {
		test('throws InvalidIntroductionError when personAId equals personBId', () => {
			expect(() =>
				createIntroduction(baseInput({ personAId: 'same', personBId: 'same' })),
			).toThrow(InvalidIntroductionError)
		})
	})

	describe('status invariants', () => {
		test('throws InvalidIntroductionError when status is not a known literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createIntroduction(baseInput({ status: 'unknown' })),
			).toThrow(InvalidIntroductionError)
		})
	})

	describe('timestamp invariants', () => {
		test('throws InvalidIntroductionError when createdAt is an Invalid Date', () => {
			expect(() =>
				createIntroduction(baseInput({ createdAt: new Date('not-a-date') })),
			).toThrow(InvalidIntroductionError)
		})

		test('throws InvalidIntroductionError when updatedAt is before createdAt', () => {
			expect(() =>
				createIntroduction(
					baseInput({
						createdAt: new Date('2026-01-02T00:00:00Z'),
						updatedAt: new Date('2026-01-01T00:00:00Z'),
					}),
				),
			).toThrow(InvalidIntroductionError)
		})
	})

	describe('error shape', () => {
		test('InvalidIntroductionError extends DomainError', () => {
			let err: unknown = null
			try {
				createIntroduction(baseInput({ id: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidIntroductionError)
			expect(err).toBeInstanceOf(DomainError)
		})

		test('InvalidIntroductionError has a stable code string', () => {
			let err: unknown = null
			try {
				createIntroduction(baseInput({ id: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidIntroductionError)
			if (err instanceof InvalidIntroductionError) {
				expect(typeof err.code).toBe('string')
				expect(err.code.length).toBeGreaterThan(0)
			}
		})
	})
})
