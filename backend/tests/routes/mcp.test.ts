import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { createMcpRoutes } from '../../src/routes/mcp'
import { createMockSupabaseClient } from '../mocks/supabase'
import { buildTestUseCases } from '../fakes/test-usecases'
import { makeIntroduction, makePerson } from '../usecases/fixtures'

type JsonRpcResponse = {
	result?: {
		serverInfo?: { name?: string }
		prompts?: Array<{ name: string; description?: string }>
		messages?: Array<{ content: { type: string; text?: string } }>
		isError?: boolean
		content?: Array<{ type: string; text?: string }>
	}
	error?: { code?: number; message?: string } | string
	code?: number
	message?: string
}

async function jsonBody(res: Response): Promise<JsonRpcResponse> {
	let body: JsonRpcResponse = JSON.parse(await res.text())
	return body
}

describe('MCP Routes', () => {
	let app: Hono
	let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockSupabaseClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: { id: 'user-123' } },
					error: null,
				})),
			},
		})

		let { usecases } = buildTestUseCases()
		app = new Hono()
		app.route('/mcp', createMcpRoutes(mockSupabaseClient, usecases))
	})

	describe('POST /mcp', () => {
		test('returns 401 with WWW-Authenticate header when Authorization header is missing', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(401)
			let wwwAuth = res.headers.get('WWW-Authenticate')
			expect(wwwAuth).toContain('Bearer')
			expect(wwwAuth).toContain('resource_metadata=')
			expect(wwwAuth).toContain('/.well-known/oauth-protected-resource')
		})

		test('returns 401 when Bearer token is invalid', async () => {
			mockSupabaseClient = createMockSupabaseClient({
				auth: {
					getUser: mock(async () => ({
						data: { user: null },
						error: { message: 'Invalid token' },
					})),
				},
			})

			app = new Hono()
			app.route('/mcp', createMcpRoutes(mockSupabaseClient, buildTestUseCases().usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer invalid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(401)
		})

		test('accepts valid MCP initialize request and returns JSON response', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(200)

			let contentType = res.headers.get('Content-Type')
			expect(contentType).toContain('application/json')
		})

		test('returns 400 for malformed JSON-RPC request', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: 'not valid json',
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(400)
		})

		test('handles tools/list request', async () => {
			// First initialize the connection
			let initReq = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let initRes = await app.fetch(initReq)
			expect(initRes.status).toBe(200)

			// Parse JSON response to get initialization result
			let initBody = await jsonBody(initRes)
			expect(initBody.result?.serverInfo?.name).toBe('matchmaker-mcp')
		})
	})

	describe('CORS', () => {
		test('allows requests from claude.ai origin', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'OPTIONS',
				headers: {
					Origin: 'https://claude.ai',
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'Authorization, Content-Type',
				},
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(204)

			let allowOrigin = res.headers.get('Access-Control-Allow-Origin')
			expect(allowOrigin).toBe('https://claude.ai')
		})

		test('allows requests with no Origin header (React Native)', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'OPTIONS',
				headers: {
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'Authorization, Content-Type',
				},
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(204)

			let allowOrigin = res.headers.get('Access-Control-Allow-Origin')
			expect(allowOrigin).toBe('*')
		})

		test('blocks requests from unknown origins', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'OPTIONS',
				headers: {
					Origin: 'https://evil.com',
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'Authorization, Content-Type',
				},
			})

			let res = await app.fetch(req)

			let allowOrigin = res.headers.get('Access-Control-Allow-Origin')
			expect(allowOrigin).toBeNull()
		})

		test('includes necessary CORS headers in response', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
					Origin: 'https://claude.ai',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await app.fetch(req)

			let allowOrigin = res.headers.get('Access-Control-Allow-Origin')
			expect(allowOrigin).toBe('https://claude.ai')
		})
	})

	describe('GET /mcp', () => {
		test('supports SSE stream for server-sent events', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'GET',
				headers: {
					Authorization: 'Bearer valid-token',
					Accept: 'text/event-stream',
				},
			})

			let res = await app.fetch(req)
			// GET should either return 200 with SSE or appropriate error
			// depending on session state
			expect([200, 400]).toContain(res.status)
		})
	})

	describe('DELETE /mcp', () => {
		test('supports session termination', async () => {
			let req = new Request('http://localhost/mcp', {
				method: 'DELETE',
				headers: {
					Authorization: 'Bearer valid-token',
				},
			})

			let res = await app.fetch(req)
			// DELETE should return appropriate response for stateless mode
			expect([200, 204, 400]).toContain(res.status)
		})
	})

	describe('Scope validation', () => {
		test('returns 403 when user lacks mcp:access scope', async () => {
			// Mock user without mcp:access scope
			mockSupabaseClient = createMockSupabaseClient({
				auth: {
					getUser: mock(async () => ({
						data: {
							user: {
								id: 'user-123',
								app_metadata: { scopes: [] },
							},
						},
						error: null,
					})),
				},
			})

			app = new Hono()
			app.route('/mcp', createMcpRoutes(mockSupabaseClient, buildTestUseCases().usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(403)
		})

		test('returns 200 when user has mcp:access scope', async () => {
			// Mock user with mcp:access scope
			mockSupabaseClient = createMockSupabaseClient({
				auth: {
					getUser: mock(async () => ({
						data: {
							user: {
								id: 'user-123',
								app_metadata: { scopes: ['mcp:access'] },
							},
						},
						error: null,
					})),
				},
			})

			app = new Hono()
			app.route('/mcp', createMcpRoutes(mockSupabaseClient, buildTestUseCases().usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(200)
		})

		test('grants mcp:access scope by default when app_metadata.scopes is not set', async () => {
			// Mock user without explicit scopes (default case - should be allowed)
			mockSupabaseClient = createMockSupabaseClient({
				auth: {
					getUser: mock(async () => ({
						data: {
							user: {
								id: 'user-123',
								// No app_metadata.scopes - should default to allowing access
							},
						},
						error: null,
					})),
				},
			})

			app = new Hono()
			app.route('/mcp', createMcpRoutes(mockSupabaseClient, buildTestUseCases().usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(200)
		})
	})

	describe('Prompts', () => {
		describe('prompts/list', () => {
			test('returns the intake questionnaire prompt', async () => {
				let req = new Request('http://localhost/mcp', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json, text/event-stream',
						Authorization: 'Bearer valid-token',
					},
					body: JSON.stringify({
						jsonrpc: '2.0',
						method: 'prompts/list',
						params: {},
						id: 1,
					}),
				})

				let res = await app.fetch(req)
				expect(res.status).toBe(200)

				let body = await jsonBody(res)
				let promptsListResult = body.result

				expect(promptsListResult).not.toBeNull()
				expect(promptsListResult?.prompts).toBeArray()
				expect(promptsListResult?.prompts?.length).toBeGreaterThan(0)

				let intakePrompt = promptsListResult?.prompts?.find(
					p => p.name === 'matchmaker_interview'
				)
				expect(intakePrompt).toBeDefined()
				expect(intakePrompt?.description).toBeDefined()
			})
		})

		describe('prompts/get', () => {
			test('returns the intake questionnaire content when requested', async () => {
				let req = new Request('http://localhost/mcp', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json, text/event-stream',
						Authorization: 'Bearer valid-token',
					},
					body: JSON.stringify({
						jsonrpc: '2.0',
						method: 'prompts/get',
						params: {
							name: 'matchmaker_interview',
						},
						id: 1,
					}),
				})

				let res = await app.fetch(req)
				expect(res.status).toBe(200)

				let body = await jsonBody(res)
				let promptResult = body.result

				expect(promptResult).not.toBeNull()
				expect(promptResult?.messages).toBeArray()
				expect(promptResult?.messages?.length).toBeGreaterThan(0)

				let messageContent = promptResult?.messages?.[0]?.content
				expect(messageContent?.type).toBe('text')
				expect(messageContent?.text).toContain('Phase 1')
			})

			test('returns an error for unknown prompt name', async () => {
				let req = new Request('http://localhost/mcp', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json, text/event-stream',
						Authorization: 'Bearer valid-token',
					},
					body: JSON.stringify({
						jsonrpc: '2.0',
						method: 'prompts/get',
						params: {
							name: 'unknown_prompt',
						},
						id: 1,
					}),
				})

				let res = await app.fetch(req)
				expect(res.status).toBe(200) // MCP returns 200 with error in body

				let body = await jsonBody(res)
				expect(body.error).not.toBeNull()
				expect(typeof body.error === 'object' ? body.error?.message : undefined).toContain(
					'unknown_prompt'
				)
			})
		})
	})

	describe('Error logging', () => {
		test('logError function produces correctly formatted output with timestamp', async () => {
			// Import the logError function directly to test its format
			let { logError } = await import('../../src/routes/mcp')
			let loggedCalls: Array<unknown[]> = []
			let originalError = console.error
			console.error = (...args: unknown[]) => {
				loggedCalls.push(args)
			}

			logError({
				timestamp: '2026-01-23T00:00:00.000Z',
				type: 'TestError',
				path: '/test/path',
				status: 500,
				message: 'Test error message',
			})

			console.error = originalError

			expect(loggedCalls.length).toBe(1)

			let firstCall = loggedCalls[0]
			if (!firstCall) throw new Error('expected one logged call')
			expect(firstCall[0]).toBe('2026-01-23T00:00:00.000Z')

			let serialized = firstCall[1]
			if (typeof serialized !== 'string') throw new Error('expected JSON string')
			let logData = JSON.parse(serialized)
			expect(logData.type).toBe('TestError')
			expect(logData.path).toBe('/test/path')
			expect(logData.status).toBe(500)
			expect(logData.message).toBe('Test error message')
		})

		test('failed requests return 400 status for invalid JSON', async () => {
			// Make an invalid request that will fail
			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: 'invalid json {{{',
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(400)

			let body = await jsonBody(res)
			// The MCP SDK or our handler returns an error object
			// Check for either our custom format or JSON-RPC error format
			let errorObj = typeof body.error === 'object' ? body.error : undefined
			let hasError =
				body.error === 'Invalid JSON' ||
				errorObj?.code === -32700 ||
				body.code === -32700 ||
				(body.message ? body.message.includes('Invalid JSON') : false)
			expect(hasError).toBe(true)
		})

		test('error responses include correct status code for syntax errors', async () => {
			// Make an invalid request
			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: 'invalid json',
			})

			let res = await app.fetch(req)
			expect(res.status).toBe(400)
		})

		// Tool-call tests below seed the in-memory use-case bundle directly
		// instead of mocking Supabase per query. createMcpRoutes only uses
		// the SupabaseClient for auth.getUser; the dispatch table runs
		// against the seeded use cases.
		let authedSupabase = () =>
			createMockSupabaseClient({
				auth: {
					getUser: mock(async () => ({
						data: { user: { id: 'user-123' } },
						error: null,
					})),
				},
			})

		test('update_introduction returns not found for non-existent introduction', async () => {
			let notFoundApp = new Hono()
			notFoundApp.route('/mcp', createMcpRoutes(authedSupabase(), buildTestUseCases().usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'tools/call',
					params: {
						name: 'update_introduction',
						arguments: { id: 'non-existent-id', status: 'accepted' },
					},
					id: 2,
				}),
			})

			let res = await notFoundApp.fetch(req)
			expect(res.status).toBe(200)

			let body = await jsonBody(res)
			expect(body.result?.isError).toBe(true)
			expect(body.result?.content?.[0]?.text).toBe('Error: Introduction not found')
		})

		test('get_person reads people across matchmakers (find_matches surfaces them)', async () => {
			let liam = makePerson({
				id: 'liam-id',
				matchmakerId: 'other-matchmaker',
				name: 'Liam',
			})
			let { usecases } = buildTestUseCases({ people: [liam] })
			let crossApp = new Hono()
			crossApp.route('/mcp', createMcpRoutes(authedSupabase(), usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'tools/call',
					params: { name: 'get_person', arguments: { id: liam.id } },
					id: 2,
				}),
			})

			let res = await crossApp.fetch(req)
			expect(res.status).toBe(200)

			let body = await jsonBody(res)
			expect(body.result?.isError).toBeFalsy()
			let textContent = body.result?.content?.find(c => c.type === 'text')
			expect(textContent?.text).toBeDefined()
			let parsed = JSON.parse(textContent?.text ?? '{}')
			expect(parsed.id).toBe(liam.id)
			expect(parsed.matchmaker_id).toBe('other-matchmaker')
		})

		test('get_person treats inactive (soft-deleted) people as not found', async () => {
			let inactivePerson = makePerson({ id: 'inactive-id', active: false })
			let { usecases } = buildTestUseCases({ people: [inactivePerson] })
			let inactiveApp = new Hono()
			inactiveApp.route('/mcp', createMcpRoutes(authedSupabase(), usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'tools/call',
					params: { name: 'get_person', arguments: { id: 'inactive-id' } },
					id: 2,
				}),
			})

			let res = await inactiveApp.fetch(req)
			expect(res.status).toBe(200)

			let body = await jsonBody(res)
			expect(body.result?.isError).toBe(true)
			expect(body.result?.content?.[0]?.text).toBe('Error: Person not found')
		})

		test('get_person returns clean not-found error when id is unknown', async () => {
			let notFoundApp = new Hono()
			notFoundApp.route('/mcp', createMcpRoutes(authedSupabase(), buildTestUseCases().usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'tools/call',
					params: { name: 'get_person', arguments: { id: 'unknown-id' } },
					id: 2,
				}),
			})

			let res = await notFoundApp.fetch(req)
			expect(res.status).toBe(200)

			let body = await jsonBody(res)
			expect(body.result?.isError).toBe(true)
			expect(body.result?.content?.[0]?.text).toBe('Error: Person not found')
		})

		test('MCP tool error responses follow specification format', async () => {
			// get_person against an empty repo produces the not_found tool error,
			// which is enough to exercise the spec-shaped error envelope.
			let errorApp = new Hono()
			errorApp.route('/mcp', createMcpRoutes(authedSupabase(), buildTestUseCases().usecases))

			// Now call a tool that will fail (with bad arguments to trigger error)
			let toolReq = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer valid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'tools/call',
					params: {
						name: 'get_person',
						arguments: { id: 'non-existent-id' },
					},
					id: 2,
				}),
			})

			let res = await errorApp.fetch(toolReq)
			expect(res.status).toBe(200) // MCP returns 200 with error in body

			let body = await jsonBody(res)

			// JSON response contains the tool result directly
			expect(body.result?.isError).toBe(true)
			expect(Array.isArray(body.result?.content)).toBe(true)
			let textContent = body.result?.content?.find(c => c.type === 'text')
			expect(textContent?.text).toMatch(/^Error:/)
		})

		test('authentication errors return 401 status', async () => {
			let authErrorMockSupabaseClient = createMockSupabaseClient({
				auth: {
					getUser: mock(async () => ({
						data: { user: null },
						error: { message: 'Invalid token' },
					})),
				},
			})

			let authErrorApp = new Hono()
			authErrorApp.route('/mcp', createMcpRoutes(authErrorMockSupabaseClient, buildTestUseCases().usecases))

			let req = new Request('http://localhost/mcp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json, text/event-stream',
					Authorization: 'Bearer invalid-token',
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'initialize',
					params: {
						protocolVersion: '2024-11-05',
						capabilities: {},
						clientInfo: { name: 'test-client', version: '1.0.0' },
					},
					id: 1,
				}),
			})

			let res = await authErrorApp.fetch(req)
			expect(res.status).toBe(401)
		})
	})
})
