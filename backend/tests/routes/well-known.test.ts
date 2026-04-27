import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import { createWellKnownRoutes } from '../../src/routes/well-known'
import type { OAuthServerMetadata } from '../../src/schemas/oauth'

describe('GET /.well-known/oauth-authorization-server', () => {
	test('should return 200 with valid JSON', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toContain('application/json')
	})

	test('should include authorization_endpoint', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)
		let body = (await res.json()) as OAuthServerMetadata

		expect(body.authorization_endpoint).toBeDefined()
		expect(typeof body.authorization_endpoint).toBe('string')
		expect(body.authorization_endpoint).toContain('/oauth/authorize')
	})

	test('should include token_endpoint', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)
		let body = (await res.json()) as OAuthServerMetadata

		expect(body.token_endpoint).toBeDefined()
		expect(typeof body.token_endpoint).toBe('string')
		expect(body.token_endpoint).toContain('/oauth/token')
	})

	test('should include registration_endpoint', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)
		let body = (await res.json()) as OAuthServerMetadata

		expect(body.registration_endpoint).toBeDefined()
		expect(typeof body.registration_endpoint).toBe('string')
		expect(body.registration_endpoint).toContain('/register')
	})

	test('should include issuer', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)
		let body = (await res.json()) as OAuthServerMetadata

		expect(body.issuer).toBeDefined()
		expect(typeof body.issuer).toBe('string')
	})

	test('should include response_types_supported with code', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)
		let body = (await res.json()) as OAuthServerMetadata

		expect(body.response_types_supported).toBeDefined()
		expect(Array.isArray(body.response_types_supported)).toBe(true)
		expect(body.response_types_supported).toContain('code')
	})

	test('should include grant_types_supported', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)
		let body = (await res.json()) as OAuthServerMetadata

		expect(body.grant_types_supported).toBeDefined()
		expect(Array.isArray(body.grant_types_supported)).toBe(true)
		expect(body.grant_types_supported).toContain('authorization_code')
		expect(body.grant_types_supported).toContain('refresh_token')
	})

	test('should include code_challenge_methods_supported with S256', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-authorization-server')

		let res = await app.fetch(req)
		let body = (await res.json()) as OAuthServerMetadata

		expect(body.code_challenge_methods_supported).toBeDefined()
		expect(Array.isArray(body.code_challenge_methods_supported)).toBe(true)
		expect(body.code_challenge_methods_supported).toContain('S256')
	})
})

type ProtectedResourceMetadata = {
	resource: string
	authorization_servers: Array<{ issuer: string }>
}

describe('GET /.well-known/oauth-protected-resource', () => {
	test('should return 200 with valid JSON', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-protected-resource')

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toContain('application/json')
	})

	test('should include authorization_servers array with issuer objects per RFC 9728', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-protected-resource')

		let res = await app.fetch(req)
		let body = (await res.json()) as ProtectedResourceMetadata

		expect(body.authorization_servers).toBeDefined()
		expect(Array.isArray(body.authorization_servers)).toBe(true)
		expect(body.authorization_servers.length).toBeGreaterThan(0)
		expect(body.authorization_servers[0]?.issuer).toBe('http://localhost')
	})

	test('should include resource identifier', async () => {
		let app = new Hono()
		app.route('/.well-known', createWellKnownRoutes())

		let req = new Request('http://localhost/.well-known/oauth-protected-resource')

		let res = await app.fetch(req)
		let body = (await res.json()) as ProtectedResourceMetadata

		expect(body.resource).toBeDefined()
		expect(typeof body.resource).toBe('string')
		expect(body.resource).toBe('http://localhost')
	})
})
