import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { createWebhookRoutes } from '../../src/router/webhooks'
import * as registry from '../../src/router/registry'
import { TestAdapter } from '../../src/adapters/test/adapter'
import type { SupabaseClient } from '@supabase/supabase-js'

let savedMessages: { threadId: string; role: string; content: unknown }[] = []
let resolvedUsers: { provider: string; senderId: string }[] = []

let createMockSupabase = (): SupabaseClient => ({}) as unknown as SupabaseClient

let mockSave = () =>
	mock(async (_client: unknown, params: any) => {
		savedMessages.push(params)
		return { ...params, id: 'msg-1', created_at: new Date().toISOString() }
	})

let mockResolveOrCreate = () =>
	mock(async (_client: unknown, provider: string, senderId: string) => {
		resolvedUsers.push({ provider, senderId })
		return 'resolved-user-id'
	})

let simpleResponse = (text: string) => ({
	id: 'msg-1',
	type: 'message' as const,
	role: 'assistant' as const,
	model: 'claude-sonnet-4-20250514',
	usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
	stop_reason: 'end_turn' as const,
	content: [{ type: 'text' as const, text }],
})

beforeEach(() => {
	registry.clear()
	savedMessages = []
	resolvedUsers = []
})

describe('Integration: Test adapter full message loop', () => {
	test('first message from new user flows through entire pipeline', async () => {
		let adapter = new TestAdapter()
		registry.register(adapter)

		let app = new Hono()
		app.route(
			'/webhook',
			createWebhookRoutes({
				supabaseClient: createMockSupabase(),
				resolveOrCreate: mockResolveOrCreate(),
				aiDeps: {
					createMessage: mock(async () => simpleResponse('Welcome to matchmaker!')),
					save: mockSave(),
					getHistory: mock(async () => []),
					executeTool: mock(async () => ({ content: '[]' })),
				},
			})
		)

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ senderId: 'new-user-1', text: 'Hi, I need a matchmaker' }),
			})
		)

		expect(res.status).toBe(200)

		// User was resolved
		expect(resolvedUsers).toHaveLength(1)
		expect(resolvedUsers[0]!.provider).toBe('test')
		expect(resolvedUsers[0]!.senderId).toBe('new-user-1')

		// Conversation was saved (user + assistant)
		expect(savedMessages).toHaveLength(2)
		expect(savedMessages[0]!.role).toBe('user')
		expect(savedMessages[0]!.content).toBe('Hi, I need a matchmaker')
		expect(savedMessages[0]!.threadId).toBe('test:new-user-1')
		expect(savedMessages[1]!.role).toBe('assistant')
		expect(savedMessages[1]!.content).toBe('Welcome to matchmaker!')

		// Reply was sent via adapter
		expect(adapter.replies).toHaveLength(1)
		expect(adapter.replies[0]!.text).toBe('Welcome to matchmaker!')
		expect(adapter.replies[0]!.senderId).toBe('new-user-1')
	})

	test('tool-calling flow executes tool and returns final response', async () => {
		let adapter = new TestAdapter()
		registry.register(adapter)

		let callCount = 0
		let app = new Hono()
		app.route(
			'/webhook',
			createWebhookRoutes({
				supabaseClient: createMockSupabase(),
				resolveOrCreate: mockResolveOrCreate(),
				aiDeps: {
					createMessage: mock(async () => {
						callCount++
						if (callCount === 1) {
							return {
								id: 'msg-1',
								type: 'message' as const,
								role: 'assistant' as const,
								model: 'claude-sonnet-4-20250514',
								usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
								stop_reason: 'tool_use' as const,
								content: [
									{ type: 'tool_use' as const, id: 'call-1', name: 'list_people', input: {} },
								],
							}
						}
						return simpleResponse('You have 2 people: Alice and Bob.')
					}),
					save: mockSave(),
					getHistory: mock(async () => []),
					executeTool: mock(async () => ({
						content: JSON.stringify([
							{ id: 'p1', name: 'Alice' },
							{ id: 'p2', name: 'Bob' },
						]),
					})),
				},
			})
		)

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ senderId: 'user-2', text: 'Show my people' }),
			})
		)

		expect(res.status).toBe(200)
		expect(adapter.replies).toHaveLength(1)
		expect(adapter.replies[0]!.text).toBe('You have 2 people: Alice and Bob.')
		expect(callCount).toBe(2)
	})

	test('multiple providers use same pipeline', async () => {
		let testAdapter = new TestAdapter()
		registry.register(testAdapter)

		let otherReplies: { text: string }[] = []
		registry.register({
			provider: 'other',
			parseInbound: mock(async (raw: unknown) => {
				let body = raw as { id: string; msg: string }
				return {
					provider: 'other',
					senderId: body.id,
					text: body.msg,
					threadId: `other:${body.id}`,
					timestamp: Date.now(),
				}
			}),
			sendReply: mock(async msg => {
				otherReplies.push({ text: msg.text })
			}),
			verifyWebhook: mock(async () => true),
		})

		let app = new Hono()
		app.route(
			'/webhook',
			createWebhookRoutes({
				supabaseClient: createMockSupabase(),
				resolveOrCreate: mockResolveOrCreate(),
				aiDeps: {
					createMessage: mock(async () => simpleResponse('Processed!')),
					save: mockSave(),
					getHistory: mock(async () => []),
					executeTool: mock(async () => ({ content: '[]' })),
				},
			})
		)

		await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ senderId: 'user-a', text: 'Hello from test' }),
			})
		)

		await app.fetch(
			new Request('http://localhost/webhook/other', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: 'user-b', msg: 'Hello from other' }),
			})
		)

		expect(testAdapter.replies).toHaveLength(1)
		expect(otherReplies).toHaveLength(1)

		// Both went through same pipeline (4 saved: 2 user + 2 assistant)
		expect(savedMessages).toHaveLength(4)
		expect(savedMessages[0]!.threadId).toBe('test:user-a')
		expect(savedMessages[2]!.threadId).toBe('other:user-b')
	})
})
