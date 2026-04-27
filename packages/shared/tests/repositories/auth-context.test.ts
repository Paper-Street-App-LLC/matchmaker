import { describe, test, expect } from 'bun:test'
import type { IAuthContext } from '../../src/repositories/auth-context'

describe('IAuthContext (contract)', () => {
	test('a stub conforming to the interface compiles and exposes userId', () => {
		let auth: IAuthContext = { userId: 'mm-1' }
		expect(auth.userId).toBe('mm-1')
	})

	test('userId is the only required field', () => {
		// @ts-expect-error — extra fields are not part of the contract
		let withExtra: IAuthContext = { userId: 'mm-1', email: 'a@b.c' }
		expect(withExtra.userId).toBe('mm-1')
	})
})
