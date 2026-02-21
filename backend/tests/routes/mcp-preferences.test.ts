import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { createMcpRoutes } from '../../src/routes/mcp'
import { createMockSupabaseClient } from '../mocks/supabase'

/**
 * Helper: send a tools/call JSON-RPC request to the MCP endpoint
 * and parse the SSE response to extract the tool result.
 */
async function callTool(
	app: Hono,
	name: string,
	args: Record<string, unknown>
): Promise<{ isError?: boolean; content: Array<{ type: string; text: string }> }> {
	let res = await app.fetch(
		new Request('http://localhost/mcp', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json, text/event-stream',
				Authorization: 'Bearer valid-token',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'tools/call',
				params: { name, arguments: args },
				id: 1,
			}),
		})
	)

	let body = await res.text()
	for (let line of body.split('\n')) {
		if (!line.startsWith('data:')) continue
		try {
			let data = JSON.parse(line.slice(5).trim())
			if (data.result) return data.result
		} catch {
			// skip
		}
	}
	throw new Error('No tool result found in SSE response')
}

describe('update_person preferences validation', () => {
	let app: Hono
	let lastUpdate: unknown

	beforeEach(() => {
		lastUpdate = undefined

		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: { id: 'user-123' } },
					error: null,
				})),
			},
			from: mock(() => ({
				update: mock((data: unknown) => {
					lastUpdate = data
					return {
						eq: mock(() => ({
							eq: mock(() => ({
								select: mock(() => ({
									single: mock(async () => ({
										data: { id: 'person-1', ...(data as object) },
										error: null,
									})),
								})),
							})),
						})),
					}
				}),
				select: mock(() => ({
					eq: mock(() => ({
						eq: mock(() => ({
							single: mock(async () => ({
								data: { id: 'person-1', name: 'Test' },
								error: null,
							})),
						})),
					})),
				})),
				insert: mock(() => ({
					select: mock(() => ({
						single: mock(async () => ({
							data: { id: 'person-1' },
							error: null,
						})),
					})),
				})),
			})),
		})

		app = new Hono()
		app.route('/mcp', createMcpRoutes(mockClient))
	})

	test('valid structured preferences pass through and get cleaned', async () => {
		let prefs = {
			aboutMe: { height: 180, build: 'athletic' },
			lookingFor: { wantsChildren: true },
		}

		let result = await callTool(app, 'update_person', {
			id: 'person-1',
			preferences: prefs,
		})

		expect(result.isError).toBeFalsy()
		let updated = lastUpdate as Record<string, unknown>
		expect(updated.preferences).toEqual(prefs)
	})

	test('extra unknown keys in preferences get stripped', async () => {
		let prefs = {
			aboutMe: { height: 180, unknownField: 'should be stripped' },
			lookingFor: { wantsChildren: true },
			totallyFake: 'gone',
		}

		let result = await callTool(app, 'update_person', {
			id: 'person-1',
			preferences: prefs,
		})

		expect(result.isError).toBeFalsy()
		let updated = lastUpdate as Record<string, unknown>
		let parsed = updated.preferences as Record<string, unknown>
		// unknownField and totallyFake should be stripped
		expect((parsed.aboutMe as Record<string, unknown>).unknownField).toBeUndefined()
		expect(parsed.totallyFake).toBeUndefined()
		// valid fields preserved
		expect((parsed.aboutMe as Record<string, unknown>).height).toBe(180)
	})

	test('invalid preferences sub-section gets dropped', async () => {
		let prefs = {
			aboutMe: { build: 'INVALID_ENUM_VALUE' },
			lookingFor: { wantsChildren: true },
		}

		let result = await callTool(app, 'update_person', {
			id: 'person-1',
			preferences: prefs,
		})

		expect(result.isError).toBeFalsy()
		let updated = lastUpdate as Record<string, unknown>
		let parsed = updated.preferences as Record<string, unknown>
		// invalid aboutMe should be dropped, valid lookingFor kept
		expect(parsed.aboutMe).toBeUndefined()
		expect(parsed.lookingFor).toEqual({ wantsChildren: true })
	})

	test('null preferences skip validation', async () => {
		let result = await callTool(app, 'update_person', {
			id: 'person-1',
			preferences: null,
			name: 'Updated Name',
		})

		expect(result.isError).toBeFalsy()
		let updated = lastUpdate as Record<string, unknown>
		// null should pass through without being parsed
		expect(updated.preferences).toBeNull()
	})

	test('undefined preferences (omitted) skip validation', async () => {
		let result = await callTool(app, 'update_person', {
			id: 'person-1',
			name: 'Updated Name',
		})

		expect(result.isError).toBeFalsy()
		let updated = lastUpdate as Record<string, unknown>
		expect(updated.preferences).toBeUndefined()
	})
})
