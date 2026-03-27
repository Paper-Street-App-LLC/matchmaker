import { describe, test, expect } from 'bun:test'
import { app } from '../src/index'

describe('GET /health', () => {
	test('returns 200 with ok status', async () => {
		let res = await app.fetch(new Request('http://localhost/health'))

		expect(res.status).toBe(200)

		let body = await res.json()
		expect(body.status).toBe('ok')
	})
})

describe('unknown routes', () => {
	test('returns 404 for unknown path', async () => {
		let res = await app.fetch(new Request('http://localhost/nonexistent'))

		expect(res.status).toBe(404)
	})
})
