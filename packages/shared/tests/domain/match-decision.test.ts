import { describe, test, expect } from 'bun:test'
import {
	createMatchDecision,
	InvalidMatchDecisionError,
	type MatchDecisionInput,
} from '../../src/domain/match-decision'
import { DomainError } from '../../src/domain/errors'

function baseInput(overrides: Partial<MatchDecisionInput> = {}): MatchDecisionInput {
	return {
		id: 'decision-1',
		matchmakerId: 'mm-1',
		personId: 'person-a',
		candidateId: 'person-b',
		decision: 'accepted',
		createdAt: new Date('2026-01-01T00:00:00Z'),
		...overrides,
	}
}

describe('createMatchDecision', () => {
	describe('happy path', () => {
		test('returns a frozen MatchDecision for an accepted decision without reason', () => {
			let result = createMatchDecision(baseInput({ decision: 'accepted' }))
			expect(result.decision).toBe('accepted')
			expect(result.declineReason).toBeNull()
			expect(Object.isFrozen(result)).toBe(true)
		})

		test('returns a frozen MatchDecision for a declined decision with a reason', () => {
			let result = createMatchDecision(
				baseInput({ decision: 'declined', declineReason: 'different life goals' }),
			)
			expect(result.decision).toBe('declined')
			expect(result.declineReason).toBe('different life goals')
			expect(Object.isFrozen(result)).toBe(true)
		})

		test('returns a frozen MatchDecision for a declined decision without a reason', () => {
			let result = createMatchDecision(baseInput({ decision: 'declined' }))
			expect(result.decision).toBe('declined')
			expect(result.declineReason).toBeNull()
		})

		test('normalizes omitted declineReason to null', () => {
			let result = createMatchDecision(baseInput({ decision: 'accepted' }))
			expect(result.declineReason).toBeNull()
		})
	})

	describe('id invariants', () => {
		test('throws InvalidMatchDecisionError when id is empty', () => {
			expect(() => createMatchDecision(baseInput({ id: '' }))).toThrow(
				InvalidMatchDecisionError,
			)
		})

		test('throws InvalidMatchDecisionError when matchmakerId is empty', () => {
			expect(() => createMatchDecision(baseInput({ matchmakerId: '' }))).toThrow(
				InvalidMatchDecisionError,
			)
		})

		test('throws InvalidMatchDecisionError when personId is empty', () => {
			expect(() => createMatchDecision(baseInput({ personId: '' }))).toThrow(
				InvalidMatchDecisionError,
			)
		})

		test('throws InvalidMatchDecisionError when candidateId is empty', () => {
			expect(() => createMatchDecision(baseInput({ candidateId: '' }))).toThrow(
				InvalidMatchDecisionError,
			)
		})
	})

	describe('self-match invariant', () => {
		test('throws InvalidMatchDecisionError when personId equals candidateId', () => {
			expect(() =>
				createMatchDecision(baseInput({ personId: 'same', candidateId: 'same' })),
			).toThrow(InvalidMatchDecisionError)
		})
	})

	describe('decision invariants', () => {
		test('throws InvalidMatchDecisionError when decision is not a known literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createMatchDecision(baseInput({ decision: 'maybe' })),
			).toThrow(InvalidMatchDecisionError)
		})
	})

	describe('decline reason coupling', () => {
		test('throws InvalidMatchDecisionError when decision is accepted and declineReason is a non-empty string', () => {
			expect(() =>
				createMatchDecision(
					baseInput({ decision: 'accepted', declineReason: 'should not be here' }),
				),
			).toThrow(InvalidMatchDecisionError)
		})

		test('throws InvalidMatchDecisionError when decision is declined and declineReason is an empty string', () => {
			expect(() =>
				createMatchDecision(baseInput({ decision: 'declined', declineReason: '' })),
			).toThrow(InvalidMatchDecisionError)
		})

		test('throws InvalidMatchDecisionError when decision is declined and declineReason is whitespace', () => {
			expect(() =>
				createMatchDecision(baseInput({ decision: 'declined', declineReason: '   ' })),
			).toThrow(InvalidMatchDecisionError)
		})

		test('accepts a declined decision with a non-empty declineReason', () => {
			let result = createMatchDecision(
				baseInput({ decision: 'declined', declineReason: 'incompatible schedules' }),
			)
			expect(result.declineReason).toBe('incompatible schedules')
		})
	})

	describe('timestamp invariants', () => {
		test('throws InvalidMatchDecisionError when createdAt is an Invalid Date', () => {
			expect(() =>
				createMatchDecision(baseInput({ createdAt: new Date('not-a-date') })),
			).toThrow(InvalidMatchDecisionError)
		})
	})

	describe('error shape', () => {
		test('InvalidMatchDecisionError extends DomainError', () => {
			let err: unknown = null
			try {
				createMatchDecision(baseInput({ id: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidMatchDecisionError)
			expect(err).toBeInstanceOf(DomainError)
		})

		test('InvalidMatchDecisionError has a stable code string', () => {
			let err: unknown = null
			try {
				createMatchDecision(baseInput({ id: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidMatchDecisionError)
			if (err instanceof InvalidMatchDecisionError) {
				expect(typeof err.code).toBe('string')
				expect(err.code.length).toBeGreaterThan(0)
			}
		})
	})
})
