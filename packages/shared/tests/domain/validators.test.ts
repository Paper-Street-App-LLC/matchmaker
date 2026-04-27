import { describe, test, expect } from 'bun:test'
import { DomainError } from '../../src/domain/errors'
import { requireNonEmptyString, assertValidDate } from '../../src/domain/validators'

class TestError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'TestError'
	}
}

describe('requireNonEmptyString', () => {
	test('returns the trimmed value when valid', () => {
		expect(requireNonEmptyString('  hello  ', 'field', 'CODE', TestError)).toBe('hello')
	})

	test('returns the original when already trimmed', () => {
		expect(requireNonEmptyString('id-1', 'field', 'CODE', TestError)).toBe('id-1')
	})

	test('throws the provided error class on empty string', () => {
		expect(() => requireNonEmptyString('', 'field', 'CODE', TestError)).toThrow(TestError)
	})

	test('throws on whitespace-only string', () => {
		expect(() => requireNonEmptyString('   ', 'field', 'CODE', TestError)).toThrow(TestError)
	})

	test('throws on non-string value', () => {
		expect(() => requireNonEmptyString(42, 'field', 'CODE', TestError)).toThrow(TestError)
	})

	test('thrown error carries the provided code', () => {
		let err: unknown = null
		try {
			requireNonEmptyString('', 'field', 'CODE_X', TestError)
		} catch (e) {
			err = e
		}
		expect(err).toBeInstanceOf(TestError)
		if (err instanceof TestError) {
			expect(err.code).toBe('CODE_X')
		}
	})
})

describe('assertValidDate', () => {
	test('does not throw for a valid Date', () => {
		expect(() => assertValidDate(new Date('2026-01-01'), 'field', 'CODE', TestError)).not.toThrow()
	})

	test('throws the provided error class for an Invalid Date', () => {
		expect(() => assertValidDate(new Date('not-a-date'), 'field', 'CODE', TestError)).toThrow(
			TestError,
		)
	})

	test('throws for non-Date values', () => {
		expect(() => assertValidDate('2026-01-01', 'field', 'CODE', TestError)).toThrow(TestError)
		expect(() => assertValidDate(null, 'field', 'CODE', TestError)).toThrow(TestError)
		expect(() => assertValidDate(undefined, 'field', 'CODE', TestError)).toThrow(TestError)
	})

	test('thrown error carries the provided code', () => {
		let err: unknown = null
		try {
			assertValidDate('bad', 'field', 'CODE_Y', TestError)
		} catch (e) {
			err = e
		}
		expect(err).toBeInstanceOf(TestError)
		if (err instanceof TestError) {
			expect(err.code).toBe('CODE_Y')
		}
	})

	test('narrows value to Date after assertion', () => {
		let raw: unknown = new Date('2026-01-01')
		assertValidDate(raw, 'field', 'CODE', TestError)
		expect(raw.getTime()).toBeGreaterThan(0)
	})
})
