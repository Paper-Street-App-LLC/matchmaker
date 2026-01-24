import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { createWellKnownRoutes } from '../../src/routes/well-known'
import { createRegisterRoutes } from '../../src/routes/register'
import { createOAuthRoutes } from '../../src/routes/oauth'
import { createLoginRoutes } from '../../src/routes/login'
import { createMockSupabaseClient } from '../mocks/supabase'
import * as clientStore from '../../src/lib/clientStore'
import * as authCodeStore from '../../src/lib/authCodeStore'

type OAuthServerMetadata = {
	issuer: string
	authorization_endpoint: string
	token_endpoint: string
	registration_endpoint: string
	response_types_supported: string[]
	grant_types_supported: string[]
	code_challenge_methods_supported: string[]
}

type ProtectedResourceMetadata = {
	resource: string
	authorization_servers: Array<{ issuer: string }>
}

type ClientRegistrationResponse = {
	client_id: string
	client_name: string
	redirect_uris: string[]
}

type OAuthTokenResponse = {
	access_token: string
	token_type: string
	expires_in: number
	refresh_token: string
}

// PKCE helper: generate code_challenge from code_verifier using S256
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
	let encoder = new TextEncoder()
	let data = encoder.encode(codeVerifier)
	let hashBuffer = await crypto.subtle.digest('SHA-256', data)
	let hashArray = new Uint8Array(hashBuffer)
	let base64 = btoa(String.fromCharCode.apply(null, Array.from(hashArray)))
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Helper to safely extract URL from Location header with proper null check
function getLocationUrl(response: Response): URL {
	let location = response.headers.get('Location')
	if (!location) {
		throw new Error('Expected Location header to be present')
	}
	return new URL(location)
}

// Helper to safely extract authorization code from callback URL
function getAuthorizationCode(callbackUrl: URL): string {
	let code = callbackUrl.searchParams.get('code')
	if (!code) {
		throw new Error('Expected authorization code to be present in callback URL')
	}
	return code
}

describe('End-to-End OAuth Flow', () => {
	let app: Hono
	let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		// Clear stores before each test
		clientStore.clearAllClients()
		authCodeStore.clearAllCodes()

		// Create mock Supabase client with successful authentication
		let mockSession = {
			user: { id: 'user-123', email: 'test@example.com' },
			access_token: 'supabase-access-token-abc123',
			refresh_token: 'supabase-refresh-token-xyz789',
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

		// Create app with all OAuth-related routes
		app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())
		app.route('/register', createRegisterRoutes())
		app.route('/oauth', createOAuthRoutes(mockSupabaseClient))
		app.route('/login', createLoginRoutes(mockSupabaseClient))
	})

	test('complete OAuth authorization code flow from discovery to token', async () => {
		// Step 1: Discover OAuth server metadata via well-known endpoint
		let discoveryReq = new Request('http://localhost/.well-known/oauth-authorization-server')
		let discoveryRes = await app.fetch(discoveryReq)

		expect(discoveryRes.status).toBe(200)
		let serverMetadata = (await discoveryRes.json()) as OAuthServerMetadata

		expect(serverMetadata.authorization_endpoint).toBe('http://localhost/oauth/authorize')
		expect(serverMetadata.token_endpoint).toBe('http://localhost/oauth/token')
		expect(serverMetadata.registration_endpoint).toBe('http://localhost/register')
		expect(serverMetadata.code_challenge_methods_supported).toContain('S256')

		// Step 2: Discover protected resource metadata
		let resourceReq = new Request('http://localhost/.well-known/oauth-protected-resource')
		let resourceRes = await app.fetch(resourceReq)

		expect(resourceRes.status).toBe(200)
		let resourceMetadata = (await resourceRes.json()) as ProtectedResourceMetadata

		expect(resourceMetadata.authorization_servers[0].issuer).toBe('http://localhost')

		// Step 3: Register client dynamically
		let registerReq = new Request('http://localhost/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_name: 'MCP Test Client',
				redirect_uris: ['http://localhost:8080/callback'],
			}),
		})
		let registerRes = await app.fetch(registerReq)

		expect(registerRes.status).toBe(201)
		let clientData = (await registerRes.json()) as ClientRegistrationResponse

		expect(clientData.client_id).toBeDefined()
		expect(clientData.client_id.length).toBeGreaterThan(0)

		// Step 4: Generate PKCE parameters
		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
		let codeChallenge = await generateCodeChallenge(codeVerifier)
		let state = 'random-state-value-12345'

		// Step 5: Start authorization flow (redirects to login)
		let authParams = new URLSearchParams({
			client_id: clientData.client_id,
			redirect_uri: 'http://localhost:8080/callback',
			response_type: 'code',
			state,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
		})
		let authReq = new Request(`http://localhost/oauth/authorize?${authParams}`)
		let authRes = await app.fetch(authReq)

		expect(authRes.status).toBe(302)
		let loginLocation = authRes.headers.get('Location')
		expect(loginLocation).toContain('/login')

		// Step 6: Submit login form (simulating user authentication)
		let loginFormData = new URLSearchParams({
			email: 'test@example.com',
			password: 'securePassword123',
			mode: 'signin',
			client_id: clientData.client_id,
			redirect_uri: 'http://localhost:8080/callback',
			response_type: 'code',
			state,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
		})
		let loginReq = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: loginFormData.toString(),
		})
		let loginRes = await app.fetch(loginReq)

		expect(loginRes.status).toBe(302)
		let callbackLocation = loginRes.headers.get('Location')
		expect(callbackLocation).toContain('http://localhost:8080/callback')
		expect(callbackLocation).toContain('code=')
		expect(callbackLocation).toContain(`state=${state}`)

		// Step 7: Extract authorization code from redirect URL
		let callbackUrl = getLocationUrl(loginRes)
		let authorizationCode = getAuthorizationCode(callbackUrl)
		let returnedState = callbackUrl.searchParams.get('state')

		expect(authorizationCode.length).toBeGreaterThan(0)
		expect(returnedState).toBe(state)

		// Step 8: Exchange authorization code for tokens
		let tokenFormData = new URLSearchParams({
			grant_type: 'authorization_code',
			code: authorizationCode,
			redirect_uri: 'http://localhost:8080/callback',
			client_id: clientData.client_id,
			code_verifier: codeVerifier,
		})
		let tokenReq = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenFormData.toString(),
		})
		let tokenRes = await app.fetch(tokenReq)

		expect(tokenRes.status).toBe(200)
		let tokenData = (await tokenRes.json()) as OAuthTokenResponse

		// Verify token response
		expect(tokenData.access_token).toBe('supabase-access-token-abc123')
		expect(tokenData.token_type).toBe('Bearer')
		expect(tokenData.expires_in).toBe(31536000)
		expect(tokenData.refresh_token).toBe('supabase-refresh-token-xyz789')
	})

	test('client can discover endpoints via well-known URLs', async () => {
		// OAuth Authorization Server Metadata
		let oauthReq = new Request('http://localhost/.well-known/oauth-authorization-server')
		let oauthRes = await app.fetch(oauthReq)

		expect(oauthRes.status).toBe(200)
		expect(oauthRes.headers.get('Content-Type')).toContain('application/json')

		let metadata = (await oauthRes.json()) as OAuthServerMetadata
		expect(metadata.authorization_endpoint).toContain('/oauth/authorize')
		expect(metadata.token_endpoint).toContain('/oauth/token')
		expect(metadata.registration_endpoint).toContain('/register')

		// Protected Resource Metadata
		let resourceReq = new Request('http://localhost/.well-known/oauth-protected-resource')
		let resourceRes = await app.fetch(resourceReq)

		expect(resourceRes.status).toBe(200)
		expect(resourceRes.headers.get('Content-Type')).toContain('application/json')

		let resourceMetadata = (await resourceRes.json()) as ProtectedResourceMetadata
		expect(resourceMetadata.authorization_servers).toBeDefined()
		expect(Array.isArray(resourceMetadata.authorization_servers)).toBe(true)
	})

	test('client can register dynamically', async () => {
		let registerReq = new Request('http://localhost/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_name: 'Dynamic OAuth Client',
				redirect_uris: ['http://myapp.example.com/oauth/callback'],
			}),
		})
		let registerRes = await app.fetch(registerReq)

		expect(registerRes.status).toBe(201)
		let clientData = (await registerRes.json()) as ClientRegistrationResponse

		expect(clientData.client_id).toBeDefined()
		expect(typeof clientData.client_id).toBe('string')
		expect(clientData.client_id.length).toBeGreaterThan(0)
		expect(clientData.client_name).toBe('Dynamic OAuth Client')
		expect(clientData.redirect_uris).toEqual(['http://myapp.example.com/oauth/callback'])
	})

	test('client can complete authorization code flow', async () => {
		// Register a client first
		let clientData = clientStore.registerClient('Test Client', ['http://localhost:8080/callback'])

		// Generate PKCE parameters
		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
		let codeChallenge = await generateCodeChallenge(codeVerifier)
		let state = 'test-state-abc'

		// Submit login to get authorization code
		let loginFormData = new URLSearchParams({
			email: 'user@example.com',
			password: 'password123',
			mode: 'signin',
			client_id: clientData.clientId,
			redirect_uri: 'http://localhost:8080/callback',
			response_type: 'code',
			state,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
		})
		let loginReq = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: loginFormData.toString(),
		})
		let loginRes = await app.fetch(loginReq)

		expect(loginRes.status).toBe(302)

		// Extract authorization code
		let callbackUrl = getLocationUrl(loginRes)
		let authorizationCode = getAuthorizationCode(callbackUrl)

		expect(authorizationCode.length).toBeGreaterThan(0)

		// Exchange code for tokens
		let tokenFormData = new URLSearchParams({
			grant_type: 'authorization_code',
			code: authorizationCode,
			redirect_uri: 'http://localhost:8080/callback',
			client_id: clientData.clientId,
			code_verifier: codeVerifier,
		})
		let tokenReq = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenFormData.toString(),
		})
		let tokenRes = await app.fetch(tokenReq)

		expect(tokenRes.status).toBe(200)
	})

	test('client receives valid access token', async () => {
		// Register a client
		let clientData = clientStore.registerClient('Token Test Client', [
			'http://localhost:8080/callback',
		])

		// Generate PKCE parameters
		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
		let codeChallenge = await generateCodeChallenge(codeVerifier)
		let state = 'token-test-state'

		// Get authorization code via login
		let loginFormData = new URLSearchParams({
			email: 'token@example.com',
			password: 'tokenpass123',
			mode: 'signin',
			client_id: clientData.clientId,
			redirect_uri: 'http://localhost:8080/callback',
			response_type: 'code',
			state,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
		})
		let loginReq = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: loginFormData.toString(),
		})
		let loginRes = await app.fetch(loginReq)

		let callbackUrl = getLocationUrl(loginRes)
		let authorizationCode = getAuthorizationCode(callbackUrl)

		// Exchange code for tokens
		let tokenFormData = new URLSearchParams({
			grant_type: 'authorization_code',
			code: authorizationCode,
			redirect_uri: 'http://localhost:8080/callback',
			client_id: clientData.clientId,
			code_verifier: codeVerifier,
		})
		let tokenReq = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenFormData.toString(),
		})
		let tokenRes = await app.fetch(tokenReq)

		expect(tokenRes.status).toBe(200)
		let tokenData = (await tokenRes.json()) as OAuthTokenResponse

		// Validate token response structure
		expect(tokenData.access_token).toBeDefined()
		expect(typeof tokenData.access_token).toBe('string')
		expect(tokenData.access_token.length).toBeGreaterThan(0)

		expect(tokenData.token_type).toBe('Bearer')

		expect(tokenData.expires_in).toBeDefined()
		expect(typeof tokenData.expires_in).toBe('number')
		expect(tokenData.expires_in).toBeGreaterThan(0)

		expect(tokenData.refresh_token).toBeDefined()
		expect(typeof tokenData.refresh_token).toBe('string')
		expect(tokenData.refresh_token.length).toBeGreaterThan(0)
	})

	test('authorization code can only be used once', async () => {
		// Register a client
		let clientData = clientStore.registerClient('Single Use Client', [
			'http://localhost:8080/callback',
		])

		// Generate PKCE parameters
		let codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
		let codeChallenge = await generateCodeChallenge(codeVerifier)
		let state = 'single-use-state'

		// Get authorization code
		let loginFormData = new URLSearchParams({
			email: 'singleuse@example.com',
			password: 'singlepass',
			mode: 'signin',
			client_id: clientData.clientId,
			redirect_uri: 'http://localhost:8080/callback',
			response_type: 'code',
			state,
			code_challenge: codeChallenge,
			code_challenge_method: 'S256',
		})
		let loginReq = new Request('http://localhost/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: loginFormData.toString(),
		})
		let loginRes = await app.fetch(loginReq)

		let callbackUrl = getLocationUrl(loginRes)
		let authorizationCode = getAuthorizationCode(callbackUrl)

		// First token exchange should succeed
		let tokenFormData = new URLSearchParams({
			grant_type: 'authorization_code',
			code: authorizationCode,
			redirect_uri: 'http://localhost:8080/callback',
			client_id: clientData.clientId,
			code_verifier: codeVerifier,
		})
		let tokenReq1 = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenFormData.toString(),
		})
		let tokenRes1 = await app.fetch(tokenReq1)
		expect(tokenRes1.status).toBe(200)

		// Second use of same code should fail
		let tokenReq2 = new Request('http://localhost/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenFormData.toString(),
		})
		let tokenRes2 = await app.fetch(tokenReq2)
		expect(tokenRes2.status).toBe(400)

		let errorBody = (await tokenRes2.json()) as { error: string }
		expect(errorBody.error).toBe('invalid_grant')
	})
})
