import { describe, test, expect } from 'bun:test'
import {
	createPerson,
	createIntroduction,
	createMatchDecision,
	createPreferences,
	DomainError,
	AuthorizationService,
} from '../../src/core/index'

describe('core re-exports', () => {
	test('exports domain factory functions', () => {
		expect(typeof createPerson).toBe('function')
		expect(typeof createIntroduction).toBe('function')
		expect(typeof createMatchDecision).toBe('function')
		expect(typeof createPreferences).toBe('function')
	})

	test('exports DomainError base class', () => {
		let error = new DomainError('TEST_CODE', 'test error')
		expect(error).toBeInstanceOf(Error)
		expect(error).toBeInstanceOf(DomainError)
		expect(error.code).toBe('TEST_CODE')
	})

	test('exports AuthorizationService', () => {
		expect(typeof AuthorizationService.canMatchmakerAccessPerson).toBe('function')
	})
})
