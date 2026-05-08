import { describe, test, expect } from 'bun:test'
import {
	createFeedback,
	InvalidFeedbackError,
	type FeedbackInput,
} from '../../src/domain/feedback'
import { DomainError } from '../../src/domain/errors'

function baseInput(overrides: Partial<FeedbackInput> = {}): FeedbackInput {
	return {
		id: 'feedback-1',
		introductionId: 'intro-1',
		fromPersonId: 'person-1',
		content: 'They got along well.',
		createdAt: new Date('2026-01-01T00:00:00Z'),
		...overrides,
	}
}

describe('createFeedback', () => {
	describe('happy path', () => {
		test('returns a frozen Feedback with sentiment defaulted to null', () => {
			let result = createFeedback(baseInput())
			expect(result.id).toBe('feedback-1')
			expect(result.introductionId).toBe('intro-1')
			expect(result.fromPersonId).toBe('person-1')
			expect(result.content).toBe('They got along well.')
			expect(result.sentiment).toBeNull()
			expect(Object.isFrozen(result)).toBe(true)
		})

		test('preserves a non-empty sentiment string', () => {
			let result = createFeedback(baseInput({ sentiment: 'positive' }))
			expect(result.sentiment).toBe('positive')
		})

		test('trims surrounding whitespace on a non-empty sentiment', () => {
			let result = createFeedback(baseInput({ sentiment: '  positive  ' }))
			expect(result.sentiment).toBe('positive')
		})

		test('normalizes empty-string sentiment to null', () => {
			let result = createFeedback(baseInput({ sentiment: '' }))
			expect(result.sentiment).toBeNull()
		})

		test('normalizes whitespace-only sentiment to null', () => {
			let result = createFeedback(baseInput({ sentiment: '   ' }))
			expect(result.sentiment).toBeNull()
		})

		test('trims surrounding whitespace on content', () => {
			let result = createFeedback(baseInput({ content: '  loved it  ' }))
			expect(result.content).toBe('loved it')
		})
	})

	describe('id invariants', () => {
		test('throws InvalidFeedbackError when id is empty', () => {
			expect(() => createFeedback(baseInput({ id: '' }))).toThrow(InvalidFeedbackError)
		})

		test('throws InvalidFeedbackError when introductionId is empty', () => {
			expect(() => createFeedback(baseInput({ introductionId: '' }))).toThrow(
				InvalidFeedbackError,
			)
		})

		test('throws InvalidFeedbackError when fromPersonId is empty', () => {
			expect(() => createFeedback(baseInput({ fromPersonId: '' }))).toThrow(
				InvalidFeedbackError,
			)
		})
	})

	describe('content invariants', () => {
		test('throws InvalidFeedbackError when content is empty', () => {
			expect(() => createFeedback(baseInput({ content: '' }))).toThrow(InvalidFeedbackError)
		})

		test('throws InvalidFeedbackError when content is whitespace-only', () => {
			expect(() => createFeedback(baseInput({ content: '   ' }))).toThrow(InvalidFeedbackError)
		})
	})

	describe('timestamp invariants', () => {
		test('throws InvalidFeedbackError when createdAt is an Invalid Date', () => {
			expect(() => createFeedback(baseInput({ createdAt: new Date('not-a-date') }))).toThrow(
				InvalidFeedbackError,
			)
		})
	})

	describe('error shape', () => {
		test('InvalidFeedbackError extends DomainError', () => {
			let err: unknown = null
			try {
				createFeedback(baseInput({ id: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidFeedbackError)
			expect(err).toBeInstanceOf(DomainError)
		})

		test('InvalidFeedbackError has a stable code string', () => {
			let err: unknown = null
			try {
				createFeedback(baseInput({ id: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidFeedbackError)
			if (err instanceof InvalidFeedbackError) {
				expect(typeof err.code).toBe('string')
				expect(err.code.length).toBeGreaterThan(0)
			}
		})
	})
})
