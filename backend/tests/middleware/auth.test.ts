import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createAuthMiddleware } from '../../src/middleware/auth'
import { createMockSupabaseClient } from '../mocks/supabase'

describe('authMiddleware', () => {
	test('should extract Bearer token and set userId in context', async () => {
		let mockUserId = 'user-123'
		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async (token: string) => ({
					data: { user: { id: mockUserId } },
					error: null,
				})),
			},
		})

		let app = new Hono()
		app.use('*', createAuthMiddleware(mockClient))
		app.get('/test', c => {
			let userId = c.get('userId')
			return c.json({ userId })
		})

		let req = new Request('http://localhost/test', {
			headers: {
				Authorization: 'Bearer valid-token',
			},
		})
		let res = await app.fetch(req)
		let json = await res.json()

		expect(res.status).toBe(200)
		expect(json.userId).toBe(mockUserId)
		expect(mockClient.auth.getUser).toHaveBeenCalledWith('valid-token')
	})

	test('should return 401 if Authorization header missing', async () => {
		let mockClient = createMockSupabaseClient()
		let app = new Hono()
		app.use('*', createAuthMiddleware(mockClient))
		app.get('/test', c => c.json({ ok: true }))

		let req = new Request('http://localhost/test')
		let res = await app.fetch(req)

		expect(res.status).toBe(401)
	})

	test('should return 401 if token format invalid', async () => {
		let mockClient = createMockSupabaseClient()
		let app = new Hono()
		app.use('*', createAuthMiddleware(mockClient))
		app.get('/test', c => c.json({ ok: true }))

		let req = new Request('http://localhost/test', {
			headers: {
				Authorization: 'InvalidFormat',
			},
		})
		let res = await app.fetch(req)

		expect(res.status).toBe(401)
	})

	test('should return 401 if token verification fails', async () => {
		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async (token: string) => ({
					data: { user: null },
					error: { message: 'Invalid token' },
				})),
			},
		})

		let app = new Hono()
		app.use('*', createAuthMiddleware(mockClient))
		app.get('/test', c => c.json({ ok: true }))

		let req = new Request('http://localhost/test', {
			headers: {
				Authorization: 'Bearer invalid-token',
			},
		})
		let res = await app.fetch(req)

		expect(res.status).toBe(401)
	})

	test('should return 401 if user not found', async () => {
		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async (token: string) => ({
					data: { user: null },
					error: null,
				})),
			},
		})

		let app = new Hono()
		app.use('*', createAuthMiddleware(mockClient))
		app.get('/test', c => c.json({ ok: true }))

		let req = new Request('http://localhost/test', {
			headers: {
				Authorization: 'Bearer no-user-token',
			},
		})
		let res = await app.fetch(req)

		expect(res.status).toBe(401)
	})
})
