import { describe, test, expect } from 'bun:test'
import {
	RepositoryError,
	PersonNotFoundError,
	IntroductionNotFoundError,
	MatchDecisionNotFoundError,
	FeedbackNotFoundError,
	RepositoryConflictError,
} from '../../src/repositories/errors'
import { DomainError } from '../../src/domain/errors'

describe('RepositoryError', () => {
	test('extends DomainError', () => {
		let err = new RepositoryError('REPOSITORY_ERROR', 'boom')
		expect(err).toBeInstanceOf(RepositoryError)
		expect(err).toBeInstanceOf(DomainError)
		expect(err).toBeInstanceOf(Error)
	})

	test('exposes the code and message it was constructed with', () => {
		let err = new RepositoryError('REPOSITORY_ERROR', 'boom')
		expect(err.code).toBe('REPOSITORY_ERROR')
		expect(err.message).toBe('boom')
	})

	test('sets name to RepositoryError', () => {
		let err = new RepositoryError('REPOSITORY_ERROR', 'boom')
		expect(err.name).toBe('RepositoryError')
	})
})

describe('PersonNotFoundError', () => {
	test('extends RepositoryError and DomainError', () => {
		let err = new PersonNotFoundError('person-1')
		expect(err).toBeInstanceOf(PersonNotFoundError)
		expect(err).toBeInstanceOf(RepositoryError)
		expect(err).toBeInstanceOf(DomainError)
	})

	test('uses the PERSON_NOT_FOUND code', () => {
		let err = new PersonNotFoundError('person-1')
		expect(err.code).toBe('PERSON_NOT_FOUND')
	})

	test('includes the person id in the message', () => {
		let err = new PersonNotFoundError('person-1')
		expect(err.message).toContain('person-1')
	})

	test('sets name to PersonNotFoundError', () => {
		let err = new PersonNotFoundError('person-1')
		expect(err.name).toBe('PersonNotFoundError')
	})
})

describe('IntroductionNotFoundError', () => {
	test('extends RepositoryError', () => {
		let err = new IntroductionNotFoundError('intro-1')
		expect(err).toBeInstanceOf(IntroductionNotFoundError)
		expect(err).toBeInstanceOf(RepositoryError)
	})

	test('uses the INTRODUCTION_NOT_FOUND code', () => {
		let err = new IntroductionNotFoundError('intro-1')
		expect(err.code).toBe('INTRODUCTION_NOT_FOUND')
	})

	test('includes the introduction id in the message', () => {
		let err = new IntroductionNotFoundError('intro-1')
		expect(err.message).toContain('intro-1')
	})
})

describe('MatchDecisionNotFoundError', () => {
	test('extends RepositoryError', () => {
		let err = new MatchDecisionNotFoundError('decision-1')
		expect(err).toBeInstanceOf(MatchDecisionNotFoundError)
		expect(err).toBeInstanceOf(RepositoryError)
	})

	test('uses the MATCH_DECISION_NOT_FOUND code', () => {
		let err = new MatchDecisionNotFoundError('decision-1')
		expect(err.code).toBe('MATCH_DECISION_NOT_FOUND')
	})
})

describe('FeedbackNotFoundError', () => {
	test('extends RepositoryError', () => {
		let err = new FeedbackNotFoundError('feedback-1')
		expect(err).toBeInstanceOf(FeedbackNotFoundError)
		expect(err).toBeInstanceOf(RepositoryError)
	})

	test('uses the FEEDBACK_NOT_FOUND code', () => {
		let err = new FeedbackNotFoundError('feedback-1')
		expect(err.code).toBe('FEEDBACK_NOT_FOUND')
	})

	test('includes the feedback id in the message', () => {
		let err = new FeedbackNotFoundError('feedback-1')
		expect(err.message).toContain('feedback-1')
	})
})

describe('RepositoryConflictError', () => {
	test('extends RepositoryError', () => {
		let err = new RepositoryConflictError('duplicate key')
		expect(err).toBeInstanceOf(RepositoryConflictError)
		expect(err).toBeInstanceOf(RepositoryError)
	})

	test('uses the REPOSITORY_CONFLICT code', () => {
		let err = new RepositoryConflictError('duplicate key')
		expect(err.code).toBe('REPOSITORY_CONFLICT')
	})

	test('preserves the supplied message', () => {
		let err = new RepositoryConflictError('duplicate key')
		expect(err.message).toBe('duplicate key')
	})
})
