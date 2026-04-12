import { describe, test, expect } from 'bun:test'
import { AuthorizationError } from '../../../src/domain/authorization/authorization-error'
import { DomainError } from '../../../src/domain/errors'

describe('AuthorizationError', () => {
	test('extends DomainError', () => {
		let err = new AuthorizationError('FORBIDDEN', 'not allowed')
		expect(err).toBeInstanceOf(DomainError)
		expect(err).toBeInstanceOf(Error)
	})

	test('carries code and message', () => {
		let err = new AuthorizationError('FORBIDDEN_PERSON_ACCESS', 'matchmaker cannot access person')
		expect(err.code).toBe('FORBIDDEN_PERSON_ACCESS')
		expect(err.message).toBe('matchmaker cannot access person')
	})

	test('sets name to AuthorizationError', () => {
		let err = new AuthorizationError('FORBIDDEN', 'not allowed')
		expect(err.name).toBe('AuthorizationError')
	})
})
