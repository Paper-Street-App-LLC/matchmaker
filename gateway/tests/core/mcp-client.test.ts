import { describe, test, expect } from 'bun:test'
import { jwtVerify } from 'jose'
import { signServiceJwt, formatToolResult } from '../../src/core/mcp-client'

let secret = 'test-secret-must-be-long-enough-for-hs256'

describe('signServiceJwt', () => {
	test('signs an HS256 JWT verifiable with the same secret', async () => {
		let token = await signServiceJwt({ secret, userId: 'user-1' })
		let { payload, protectedHeader } = await jwtVerify(token, new TextEncoder().encode(secret))

		expect(protectedHeader.alg).toBe('HS256')
		expect(payload.sub).toBe('user-1')
	})

	test('sets aud=authenticated and role=authenticated for Supabase compatibility', async () => {
		let token = await signServiceJwt({ secret, userId: 'user-1' })
		let { payload } = await jwtVerify(token, new TextEncoder().encode(secret))

		expect(payload.aud).toBe('authenticated')
		expect(payload.role).toBe('authenticated')
	})

	test('expires within 5 minutes of issue', async () => {
		let nowSec = Math.floor(Date.now() / 1000)
		let token = await signServiceJwt({
			secret,
			userId: 'user-1',
			now: () => nowSec * 1000,
		})
		let { payload } = await jwtVerify(token, new TextEncoder().encode(secret))

		expect(payload.iat).toBe(nowSec)
		expect(payload.exp).toBe(nowSec + 300)
	})

	test('rejects when verified with the wrong secret', async () => {
		let token = await signServiceJwt({ secret, userId: 'user-1' })
		await expect(
			jwtVerify(token, new TextEncoder().encode('different-secret-still-long-enough')),
		).rejects.toThrow()
	})
})

describe('formatToolResult', () => {
	test('joins text blocks with newlines', () => {
		let out = formatToolResult({
			content: [
				{ type: 'text', text: 'line one' },
				{ type: 'text', text: 'line two' },
			],
		})
		expect(out).toBe('line one\nline two')
	})

	test('returns empty string when content is missing or empty', () => {
		expect(formatToolResult({})).toBe('')
		expect(formatToolResult({ content: [] })).toBe('')
	})

	test('skips non-text content blocks', () => {
		let out = formatToolResult({
			content: [
				{ type: 'image', data: 'base64' },
				{ type: 'text', text: 'visible' },
			],
		})
		expect(out).toBe('visible')
	})

	test('throws when isError is true, surfacing the text payload', () => {
		expect(() =>
			formatToolResult({
				isError: true,
				content: [{ type: 'text', text: 'permission denied' }],
			}),
		).toThrow('permission denied')
	})

	test('throws a generic error when isError is true with no text content', () => {
		expect(() => formatToolResult({ isError: true, content: [] })).toThrow()
	})
})
