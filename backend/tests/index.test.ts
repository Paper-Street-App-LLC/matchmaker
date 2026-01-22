import { describe, test, expect } from 'bun:test'
import { z } from 'zod'
import { app } from '../src/index'

let welcomeSchema = z.object({
	message: z.string(),
	version: z.string(),
})

let healthSchema = z.object({
	status: z.string(),
	timestamp: z.string(),
})

describe('API Application', () => {
	describe('Public Routes', () => {
		test('GET / should return welcome message', async () => {
			let req = new Request('http://localhost/')
			let res = await app.fetch(req)

			expect(res.status).toBe(200)

			let json = (await res.json()) as { message: string; version: string }
			let data = welcomeSchema.parse(json)

			expect(data.message).toBe('Matchmaker API')
			expect(data.version).toBe('0.1.0')
		})

		test('GET /health should return healthy status', async () => {
			let req = new Request('http://localhost/health')
			let res = await app.fetch(req)

			expect(res.status).toBe(200)

			let json = (await res.json()) as { status: string; timestamp: string }
			let data = healthSchema.parse(json)

			expect(data.status).toBe('healthy')
			expect(data.timestamp).toBeDefined()
		})
	})

	describe('Middleware', () => {
		test('should have CORS enabled', async () => {
			let req = new Request('http://localhost/', {
				method: 'OPTIONS',
			})
			let res = await app.fetch(req)

			expect(res.headers.has('access-control-allow-origin')).toBe(true)
		})
	})
})
