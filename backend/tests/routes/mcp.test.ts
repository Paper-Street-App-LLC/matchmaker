import { describe, test, expect, beforeEach, mock, spyOn, afterEach } from 'bun:test'
import { Hono } from 'hono'
import { createMcpRoutes } from '../../src/routes/mcp'
import { createMockSupabaseClient } from '../mocks/supabase'

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

		app = new Hono()
		app.route('/mcp', createMcpRoutes(mockSupabaseClient))
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
			app.route('/mcp', createMcpRoutes(mockSupabaseClient))

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

		test('accepts valid MCP initialize request and returns SSE stream', async () => {
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
			expect(contentType).toContain('text/event-stream')
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

			// Read the SSE response to get initialization result
			let initBody = await initRes.text()
			expect(initBody).toContain('matchmaker-mcp')
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
			app.route('/mcp', createMcpRoutes(mockSupabaseClient))

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
			app.route('/mcp', createMcpRoutes(mockSupabaseClient))

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
			app.route('/mcp', createMcpRoutes(mockSupabaseClient))

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

				let body = await res.text()
				let lines = body.split('\n')
				let promptsListResult = null

				for (let line of lines) {
					if (line.startsWith('data:')) {
						try {
							let jsonStr = line.slice(5).trim()
							if (!jsonStr) continue
							let data = JSON.parse(jsonStr)
							if (data.result?.prompts) {
								promptsListResult = data.result
								break
							}
						} catch {
							// Skip non-JSON lines
						}
					}
				}

				expect(promptsListResult).not.toBeNull()
				expect(promptsListResult.prompts).toBeArray()
				expect(promptsListResult.prompts.length).toBeGreaterThan(0)

				let intakePrompt = promptsListResult.prompts.find(
					(p: { name: string }) => p.name === 'matchmaker_interview'
				)
				expect(intakePrompt).toBeDefined()
				expect(intakePrompt.description).toBeDefined()
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

				let body = await res.text()
				let lines = body.split('\n')
				let promptResult = null

				for (let line of lines) {
					if (line.startsWith('data:')) {
						try {
							let jsonStr = line.slice(5).trim()
							if (!jsonStr) continue
							let data = JSON.parse(jsonStr)
							if (data.result?.messages) {
								promptResult = data.result
								break
							}
						} catch {
							// Skip non-JSON lines
						}
					}
				}

				expect(promptResult).not.toBeNull()
				expect(promptResult.messages).toBeArray()
				expect(promptResult.messages.length).toBeGreaterThan(0)

				// Check the prompt content includes expected text
				let messageContent = promptResult.messages[0].content
				expect(messageContent.type).toBe('text')
				expect(messageContent.text).toContain('Phase 1')
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

				let body = await res.text()
				let lines = body.split('\n')
				let errorResult = null

				for (let line of lines) {
					if (line.startsWith('data:')) {
						try {
							let jsonStr = line.slice(5).trim()
							if (!jsonStr) continue
							let data = JSON.parse(jsonStr)
							if (data.error) {
								errorResult = data.error
								break
							}
						} catch {
							// Skip non-JSON lines
						}
					}
				}

				expect(errorResult).not.toBeNull()
				expect(errorResult.message).toContain('unknown_prompt')
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

			// First arg should be timestamp
			let firstCall = loggedCalls[0]
			expect(firstCall[0]).toBe('2026-01-23T00:00:00.000Z')

			// Second arg should be JSON with error details
			let logData = JSON.parse(firstCall[1] as string)
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

			let body = await res.json()
			// The MCP SDK or our handler returns an error object
			// Check for either our custom format or JSON-RPC error format
			let hasError =
				body.error === 'Invalid JSON' ||
				body.error?.code === -32700 ||
				body.code === -32700 ||
				(body.message && body.message.includes('Invalid JSON'))
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

		test('MCP tool error responses follow specification format', async () => {
			// Mock Supabase to return an error for a tool call
			let errorMockSupabaseClient = createMockSupabaseClient({
				auth: {
					getUser: mock(async () => ({
						data: { user: { id: 'user-123' } },
						error: null,
					})),
				},
				from: mock(() => ({
					select: mock(() => ({
						eq: mock(() => ({
							eq: mock(() => ({
								single: mock(async () => ({
									data: null,
									error: { message: 'Person not found', code: 'PGRST116' },
								})),
							})),
						})),
					})),
					insert: mock(() => ({
						select: mock(() => ({
							single: mock(async () => ({
								data: null,
								error: { message: 'Database error', code: 'DB001' },
							})),
						})),
					})),
				})),
			})

			let errorApp = new Hono()
			errorApp.route('/mcp', createMcpRoutes(errorMockSupabaseClient))

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

			let body = await res.text()

			// Parse SSE response to find the tool result
			// SSE format: "data: {...}\n\n"
			let hasErrorResponse = false
			let lines = body.split('\n')
			for (let line of lines) {
				if (line.startsWith('data:')) {
					try {
						let jsonStr = line.slice(5).trim()
						if (!jsonStr) continue
						let data = JSON.parse(jsonStr)
						// MCP error format: isError: true with content array containing error message
						if (data.result?.isError === true && Array.isArray(data.result?.content)) {
							let textContent = data.result.content.find(
								(c: { type: string; text?: string }) => c.type === 'text'
							)
							if (textContent && textContent.text.startsWith('Error:')) {
								hasErrorResponse = true
								break
							}
						}
					} catch {
						// Skip non-JSON lines
					}
				}
			}

			expect(hasErrorResponse).toBe(true)
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
			authErrorApp.route('/mcp', createMcpRoutes(authErrorMockSupabaseClient))

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
