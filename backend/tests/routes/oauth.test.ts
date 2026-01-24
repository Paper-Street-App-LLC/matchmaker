import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { createOAuthRoutes } from '../../src/routes/oauth'
import { createMockSupabaseClient } from '../mocks/supabase'
import * as authCodeStore from '../../src/lib/authCodeStore'

type OAuthErrorResponse = { error: string; error_description?: string }
type OAuthTokenResponse = {
	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
}

describe('GET /oauth/authorize', () => {
	test('should redirect to login page with OAuth parameters', async () => {
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes())

		let req = new Request(
			'http://localhost/oauth/authorize?client_id=test&redirect_uri=http://example.com/callback&response_type=code&state=abc123&code_challenge=challenge1234567890123456789012345678901234&code_challenge_method=S256'
		)

		let res = await app.fetch(req)

		expect(res.status).toBe(302)
		let location = res.headers.get('Location')
		expect(location).toContain('/login')
		expect(location).toContain('client_id=test')
		expect(location).toContain('state=abc123')
	})
})

describe('POST /oauth/token', () => {
	let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		// Clear the auth code store before each test
		authCodeStore.clearAllCodes()
	})

	test('should return 400 for missing grant_type', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		let formData = new URLSearchParams()
		formData.append('code', 'some-auth-code')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'test-client')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_request')
	})

	test('should return 400 for unsupported grant_type', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		let formData = new URLSearchParams()
		formData.append('grant_type', 'password')
		formData.append('code', 'some-auth-code')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'test-client')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('unsupported_grant_type')
	})

	test('should return 400 for missing authorization code', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		let formData = new URLSearchParams()
		formData.append('grant_type', 'authorization_code')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'test-client')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_request')
	})

	test('should return 400 for invalid/expired authorization code', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		let formData = new URLSearchParams()
		formData.append('grant_type', 'authorization_code')
		formData.append('code', 'invalid-code')
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'test-client')
		formData.append('code_verifier', 'verifier12345678901234567890123456789012345')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_grant')
	})

	test('should exchange valid authorization code for tokens', async () => {
		let mockSession = {
			user: { id: 'user-123', email: 'test@example.com' },
			access_token: 'supabase-access-token-123',
			refresh_token: 'supabase-refresh-token-456',
		}

		mockSupabaseClient = createMockSupabaseClient({
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
					data: { user: mockSession.user, session: mockSession },
					error: null,
				})),
			},
		})

		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		// First, store a valid authorization code
		let codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
		let authCode = authCodeStore.storeAuthorizationCode({
			userId: 'user-123',
			clientId: 'test-client',
			redirectUri: 'http://example.com/callback',
			codeChallenge,
			accessToken: 'supabase-access-token-123',
			refreshToken: 'supabase-refresh-token-456',
		})

		// The code_verifier that produces the above code_challenge using S256
		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'

		let formData = new URLSearchParams()
		formData.append('grant_type', 'authorization_code')
		formData.append('code', authCode)
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'test-client')
		formData.append('code_verifier', codeVerifier)

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
		let body = (await res.json()) as OAuthTokenResponse
		expect(body.token_type).toBe('Bearer')
		expect(body.access_token).toBe('supabase-access-token-123')
		expect(body.refresh_token).toBe('supabase-refresh-token-456')
		expect(body.expires_in).toBe(31536000) // 1 year in seconds
	})

	test('should return 400 for invalid PKCE code_verifier', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		// Store a valid authorization code with a specific code_challenge
		let codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
		let authCode = authCodeStore.storeAuthorizationCode({
			userId: 'user-123',
			clientId: 'test-client',
			redirectUri: 'http://example.com/callback',
			codeChallenge,
			accessToken: 'token-123',
			refreshToken: 'refresh-123',
		})

		let formData = new URLSearchParams()
		formData.append('grant_type', 'authorization_code')
		formData.append('code', authCode)
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'test-client')
		formData.append('code_verifier', 'wrong-verifier-that-does-not-match-at-all!!')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_grant')
	})

	test('should return 400 for mismatched redirect_uri', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		// Store a valid authorization code
		let codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
		let authCode = authCodeStore.storeAuthorizationCode({
			userId: 'user-123',
			clientId: 'test-client',
			redirectUri: 'http://example.com/callback',
			codeChallenge,
			accessToken: 'token-123',
			refreshToken: 'refresh-123',
		})

		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'

		let formData = new URLSearchParams()
		formData.append('grant_type', 'authorization_code')
		formData.append('code', authCode)
		formData.append('redirect_uri', 'http://evil.com/callback') // Different redirect_uri
		formData.append('client_id', 'test-client')
		formData.append('code_verifier', codeVerifier)

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_grant')
	})

	test('should return 400 for mismatched client_id', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		// Store a valid authorization code
		let codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
		let authCode = authCodeStore.storeAuthorizationCode({
			userId: 'user-123',
			clientId: 'test-client',
			redirectUri: 'http://example.com/callback',
			codeChallenge,
			accessToken: 'token-123',
			refreshToken: 'refresh-123',
		})

		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'

		let formData = new URLSearchParams()
		formData.append('grant_type', 'authorization_code')
		formData.append('code', authCode)
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'different-client') // Different client_id
		formData.append('code_verifier', codeVerifier)

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_grant')
	})

	test('should prevent reuse of authorization code', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		// Store a valid authorization code
		let codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
		let authCode = authCodeStore.storeAuthorizationCode({
			userId: 'user-123',
			clientId: 'test-client',
			redirectUri: 'http://example.com/callback',
			codeChallenge,
			accessToken: 'token-123',
			refreshToken: 'refresh-123',
		})

		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'

		let formData = new URLSearchParams()
		formData.append('grant_type', 'authorization_code')
		formData.append('code', authCode)
		formData.append('redirect_uri', 'http://example.com/callback')
		formData.append('client_id', 'test-client')
		formData.append('code_verifier', codeVerifier)

		let req1 = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		// First request should succeed
		let res1 = await app.fetch(req1)
		expect(res1.status).toBe(200)

		// Second request with same code should fail
		let req2 = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res2 = await app.fetch(req2)
		expect(res2.status).toBe(400)
		let body = (await res2.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_grant')
	})
})

describe('POST /oauth/token (refresh_token grant)', () => {
	let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

	test('should exchange refresh token for new access token', async () => {
		let mockSession = {
			user: { id: 'user-123', email: 'test@example.com' },
			access_token: 'new-access-token-789',
			refresh_token: 'new-refresh-token-012',
		}

		mockSupabaseClient = createMockSupabaseClient({
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
					data: { user: mockSession.user, session: mockSession },
					error: null,
				})),
				refreshSession: mock(async () => ({
					data: { user: mockSession.user, session: mockSession },
					error: null,
				})),
			},
		})

		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		let formData = new URLSearchParams()
		formData.append('grant_type', 'refresh_token')
		formData.append('refresh_token', 'existing-refresh-token')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
		let body = (await res.json()) as OAuthTokenResponse
		expect(body.token_type).toBe('Bearer')
		expect(body.access_token).toBe('new-access-token-789')
		expect(body.refresh_token).toBe('new-refresh-token-012')
		expect(body.expires_in).toBe(31536000)
	})

	test('should return 400 for invalid refresh token', async () => {
		mockSupabaseClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: null },
					error: { message: 'Invalid token' },
				})),
				signInWithPassword: mock(async () => ({
					data: { user: null, session: null },
					error: null,
				})),
				signUp: mock(async () => ({
					data: { user: null, session: null },
					error: null,
				})),
				refreshSession: mock(async () => ({
					data: { user: null, session: null },
					error: { message: 'Invalid refresh token' },
				})),
			},
		})

		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		let formData = new URLSearchParams()
		formData.append('grant_type', 'refresh_token')
		formData.append('refresh_token', 'invalid-refresh-token')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_grant')
	})

	test('should return 400 for missing refresh_token', async () => {
		mockSupabaseClient = createMockSupabaseClient()
		let app = new Hono()
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))

		let formData = new URLSearchParams()
		formData.append('grant_type', 'refresh_token')

		let req = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData.toString(),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
		let body = (await res.json()) as OAuthErrorResponse
		expect(body.error).toBe('invalid_request')
	})
})
