import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { createLoginRoutes } from '../../src/routes/login'
import { createMockSupabaseClient } from '../mocks/supabase'

describe('GET /login', () => {
	test('should return HTML login page', async () => {
		let mockClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/login', createLoginRoutes(mockClient))

		let req = new Request(
			'http://localhost/login?client_id=test&redirect_uri=http://example.com/callback&response_type=code&state=abc123&code_challenge=challenge1234567890123456789012345678901234&code_challenge_method=S256'
		)

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toContain('text/html')

		let html = await res.text()
		expect(html).toContain('Sign In')
		expect(html).toContain('email')
		expect(html).toContain('password')
	})

	test('should preserve OAuth parameters in the form', async () => {
		let mockClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/login', createLoginRoutes(mockClient))

		let req = new Request(
			'http://localhost/login?client_id=my-client&redirect_uri=http://example.com/callback&response_type=code&state=mystate&code_challenge=challenge1234567890123456789012345678901234&code_challenge_method=S256'
		)

		let res = await app.fetch(req)
		let html = await res.text()

		expect(html).toContain('my-client')
		expect(html).toContain('http://example.com/callback')
		expect(html).toContain('mystate')
	})

	test('should include toggle for Create Account mode', async () => {
		let mockClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/login', createLoginRoutes(mockClient))

		let req = new Request(
			'http://localhost/login?client_id=test&redirect_uri=http://example.com/callback&response_type=code&state=abc123&code_challenge=challenge1234567890123456789012345678901234&code_challenge_method=S256'
		)

		let res = await app.fetch(req)
		let html = await res.text()

		expect(html).toContain('Create Account')
		expect(html).toContain('Sign In')
	})
})

describe('POST /login (Sign In)', () => {
	test('should sign in user with valid credentials', async () => {
		let mockSession = {
			user: { id: 'user-123', email: 'test@example.com' },
			access_token: 'access-token-123',
		}

		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: mockSession.user },
					error: null,
				})),
				signInWithPassword: mock(async () => ({
					data: { user: mockSession.user, session: mockSession },
					error: null,
				})),
				signUp: mock(async () => ({
					data: { user: null, session: null },
					error: null,
				})),
			},
		})

		let app = new Hono()
		app.route('/login', createLoginRoutes(mockClient))

		let formData = new URLSearchParams()
		formData.append('email', 'test@example.com')
		formData.append('password', 'password123')
		formData.append('mode', 'signin')
		formData.append('client_id', 'test-client')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('response_type', 'code')
		formData.append('state', 'abc123')
		formData.append('code_challenge', 'challenge1234567890123456789012345678901234')
		formData.append('code_challenge_method', 'S256')

		let req = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(302)
		let location = res.headers.get('Location')
		expect(location).toContain('http://example.com/callback')
		expect(location).toContain('code=')
		expect(location).toContain('state=abc123')
	})

	test('should return error for invalid credentials', async () => {
		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: null },
					error: { message: 'Invalid login credentials' },
				})),
				signInWithPassword: mock(async () => ({
					data: { user: null, session: null },
					error: { message: 'Invalid login credentials' },
				})),
				signUp: mock(async () => ({
					data: { user: null, session: null },
					error: null,
				})),
			},
		})

		let app = new Hono()
		app.route('/login', createLoginRoutes(mockClient))

		let formData = new URLSearchParams()
		formData.append('email', 'test@example.com')
		formData.append('password', 'wrongpassword')
		formData.append('mode', 'signin')
		formData.append('client_id', 'test-client')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('response_type', 'code')
		formData.append('state', 'abc123')
		formData.append('code_challenge', 'challenge1234567890123456789012345678901234')
		formData.append('code_challenge_method', 'S256')

		let req = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
		let html = await res.text()
		expect(html).toContain('Invalid login credentials')
	})
})

describe('POST /login (Sign Up)', () => {
	test('should create account and redirect with code', async () => {
		let mockSession = {
			user: { id: 'new-user-123', email: 'new@example.com' },
			access_token: 'new-access-token',
		}

		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: mockSession.user },
					error: null,
				})),
				signInWithPassword: mock(async () => ({
					data: { user: null, session: null },
					error: null,
				})),
				signUp: mock(async () => ({
					data: { user: mockSession.user, session: mockSession },
					error: null,
				})),
			},
		})

		let app = new Hono()
		app.route('/login', createLoginRoutes(mockClient))

		let formData = new URLSearchParams()
		formData.append('email', 'new@example.com')
		formData.append('password', 'newpassword123')
		formData.append('mode', 'signup')
		formData.append('client_id', 'test-client')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('response_type', 'code')
		formData.append('state', 'xyz789')
		formData.append('code_challenge', 'challenge1234567890123456789012345678901234')
		formData.append('code_challenge_method', 'S256')

		let req = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(302)
		let location = res.headers.get('Location')
		expect(location).toContain('http://example.com/callback')
		expect(location).toContain('code=')
		expect(location).toContain('state=xyz789')
	})

	test('should return error when email already exists', async () => {
		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: null },
					error: { message: 'User already registered' },
				})),
				signInWithPassword: mock(async () => ({
					data: { user: null, session: null },
					error: null,
				})),
				signUp: mock(async () => ({
					data: { user: null, session: null },
					error: { message: 'User already registered' },
				})),
			},
		})

		let app = new Hono()
		app.route('/login', createLoginRoutes(mockClient))

		let formData = new URLSearchParams()
		formData.append('email', 'existing@example.com')
		formData.append('password', 'password123')
		formData.append('mode', 'signup')
		formData.append('client_id', 'test-client')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('response_type', 'code')
		formData.append('state', 'abc123')
		formData.append('code_challenge', 'challenge1234567890123456789012345678901234')
		formData.append('code_challenge_method', 'S256')

		let req = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
		let html = await res.text()
		expect(html).toContain('User already registered')
	})
})
