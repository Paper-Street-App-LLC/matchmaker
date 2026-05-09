import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Hono } from 'hono'
import { createMcpRoutes } from '../../src/routes/mcp'
import { createMockSupabaseClient } from '../mocks/supabase'
import { buildTestUseCases } from '../fakes/test-usecases'
import { makePerson } from '../usecases/fixtures'
import type { InMemoryPersonRepository } from '../fakes/in-memory-repositories'

/**
 * Helper: send a tools/call JSON-RPC request to the MCP endpoint
 * and parse the JSON response to extract the tool result.
 */
type ToolResult = { isError?: boolean; content: Array<{ type: string; text: string }> }
type JsonRpcResponse = { result?: ToolResult }

async function callTool(
	app: Hono,
	name: string,
	args: Record<string, unknown>
): Promise<ToolResult> {
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

	let body: JsonRpcResponse = JSON.parse(await res.text())
	if (!body.result) throw new Error('No tool result found in JSON response')
	return body.result
}

describe('update_person preferences validation', () => {
	let app: Hono
	let personRepo: InMemoryPersonRepository

	let PERSON_ID = 'person-1'

	beforeEach(() => {
		let mockClient = createMockSupabaseClient({
			auth: {
				getUser: mock(async () => ({
					data: { user: { id: 'user-123' } },
					error: null,
				})),
			},
		})

		let bundle = buildTestUseCases({
			people: [makePerson({ id: PERSON_ID, matchmakerId: 'user-123', name: 'Test' })],
		})
		personRepo = bundle.personRepo

		app = new Hono()
		app.route('/mcp', createMcpRoutes(mockClient, bundle.usecases))
	})

	let lastPersistedPreferences = async (): Promise<unknown> => {
		let person = await personRepo.findById(PERSON_ID)
		return person?.preferences ?? null
	}

	test('valid structured preferences pass through and get cleaned', async () => {
		let prefs = {
			aboutMe: { height: 180, build: 'athletic' },
			lookingFor: { wantsChildren: true },
		}

		let result = await callTool(app, 'update_person', {
			id: PERSON_ID,
			preferences: prefs,
		})

		expect(result.isError).toBeFalsy()
		expect(await lastPersistedPreferences()).toEqual(prefs)
	})

	test('extra unknown keys in preferences get stripped', async () => {
		let prefs = {
			aboutMe: { height: 180, unknownField: 'should be stripped' },
			lookingFor: { wantsChildren: true },
			totallyFake: 'gone',
		}

		let result = await callTool(app, 'update_person', {
			id: PERSON_ID,
			preferences: prefs,
		})

		expect(result.isError).toBeFalsy()
		let parsed = (await lastPersistedPreferences()) as Record<string, unknown>
		// unknownField and totallyFake should be stripped
		expect((parsed.aboutMe as Record<string, unknown>).unknownField).toBeUndefined()
		expect(parsed.totallyFake).toBeUndefined()
		// valid fields preserved
		expect((parsed.aboutMe as Record<string, unknown>).height).toBe(180)
	})

	test('invalid preferences enum value rejects with a tool error and does not update', async () => {
		let prefs = {
			aboutMe: { build: 'INVALID_ENUM_VALUE' },
			lookingFor: { wantsChildren: true },
		}

		let result = await callTool(app, 'update_person', {
			id: PERSON_ID,
			preferences: prefs,
		})

		expect(result.isError).toBe(true)
		expect(result.content[0]?.text).toMatch(/aboutMe.*build/i)
		// Persisted preferences remain at their seeded value (null).
		expect(await lastPersistedPreferences()).toBeNull()
	})

	test('invalid preferences type (religionRequired boolean) rejects with a tool error', async () => {
		let prefs = {
			lookingFor: { religionRequired: true },
		}

		let result = await callTool(app, 'update_person', {
			id: PERSON_ID,
			preferences: prefs,
		})

		expect(result.isError).toBe(true)
		expect(result.content[0]?.text).toMatch(/religionRequired/)
		expect(await lastPersistedPreferences()).toBeNull()
	})

	test('null preferences clear preferences', async () => {
		let result = await callTool(app, 'update_person', {
			id: PERSON_ID,
			preferences: null,
			name: 'Updated Name',
		})

		expect(result.isError).toBeFalsy()
		// null clears preferences explicitly
		expect(await lastPersistedPreferences()).toBeNull()
	})

	test('undefined preferences (omitted) skip validation and leave preferences alone', async () => {
		let result = await callTool(app, 'update_person', {
			id: PERSON_ID,
			name: 'Updated Name',
		})

		expect(result.isError).toBeFalsy()
		// Seeded preferences default is null and stays null when omitted from the patch.
		expect(await lastPersistedPreferences()).toBeNull()
	})
})
