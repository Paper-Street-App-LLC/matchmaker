import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { createWebhookRoutes } from '../../src/router/webhooks'
import * as registry from '../../src/router/registry'
import type { ChatProviderAdapter } from '../../src/adapters/types'
import type { SupabaseClient } from '@supabase/supabase-js'

let createMockAdapter = (overrides: Partial<ChatProviderAdapter> = {}): ChatProviderAdapter => ({
	provider: 'test',
	parseInbound: mock(async (raw: unknown) => {
		let body = raw as { senderId: string; text: string }
		return {
			provider: 'test',
			senderId: body.senderId,
			text: body.text,
			threadId: `test:${body.senderId}`,
			timestamp: Date.now(),
		}
	}),
	sendReply: mock(async () => {}),
	verifyWebhook: mock(async () => true),
	...overrides,
})

let createMockSupabase = (): SupabaseClient => ({}) as unknown as SupabaseClient

let createApp = () => {
	let app = new Hono()
	app.route(
		'/webhook',
		createWebhookRoutes({
			supabaseClient: createMockSupabase(),
			resolveOrCreate: mock(async () => 'resolved-user-id'),
			aiDeps: {
				createMessage: mock(async () => ({
					id: 'msg-1',
					type: 'message' as const,
					role: 'assistant' as const,
					model: 'claude-sonnet-4-20250514',
					usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
					stop_reason: 'end_turn' as const,
					content: [{ type: 'text' as const, text: 'AI response' }],
				})),
				save: mock(async (_client: unknown, params: any) => ({
					...params,
					id: 'msg-1',
					created_at: new Date().toISOString(),
				})),
				getHistory: mock(async () => []),
				executeTool: mock(async () => ({ content: '[]' })),
			},
		})
	)
	return app
}

beforeEach(() => {
	registry.clear()
})

describe('POST /webhook/:provider', () => {
	test('routes to registered adapter and returns ok', async () => {
		let adapter = createMockAdapter()
		registry.register(adapter)
		let app = createApp()

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ senderId: 'user1', text: 'Hello' }),
			})
		)

		expect(res.status).toBe(200)
		let body = await res.json()
		expect(body.ok).toBe(true)
		expect(adapter.parseInbound).toHaveBeenCalled()
		expect(adapter.sendReply).toHaveBeenCalled()
	})

	test('returns 404 for unknown provider', async () => {
		let app = createApp()

		let res = await app.fetch(
			new Request('http://localhost/webhook/unknown', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: 'Hello' }),
			})
		)

		expect(res.status).toBe(404)
		let body = await res.json()
		expect(body.error).toContain('unknown')
	})

	test('returns 401 when webhook verification fails', async () => {
		let adapter = createMockAdapter({
			verifyWebhook: mock(async () => false),
		})
		registry.register(adapter)
		let app = createApp()

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ senderId: 'user1', text: 'Hello' }),
			})
		)

		expect(res.status).toBe(401)
	})

	test('returns 400 when adapter parse fails', async () => {
		let adapter = createMockAdapter({
			parseInbound: mock(async () => {
				throw new Error('bad payload')
			}),
		})
		registry.register(adapter)
		let app = createApp()

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bad: 'data' }),
			})
		)

		expect(res.status).toBe(400)
	})
})
