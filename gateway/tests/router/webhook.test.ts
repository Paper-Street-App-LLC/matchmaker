import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import type { ChatAdapter } from '../../src/types/adapter'
import type { RawInboundMessage } from '../../src/types/messages'
import { HandleInboundMessage } from '../../src/services/handle-inbound-message'
import { createWebhookRouter } from '../../src/router/webhook'

let validRaw: RawInboundMessage = {
	provider: 'test',
	senderId: 'sender-123',
	text: 'hello',
	threadId: 'thread-456',
	timestamp: 1711900000000,
}

let resolvedUserId = '550e8400-e29b-41d4-a716-446655440000'

function createMockAdapter(overrides: Partial<ChatAdapter> = {}): ChatAdapter {
	return {
		provider: 'test',
		parseInbound: async () => validRaw,
		sendReply: async () => {},
		resolveUser: async () => ({ userId: resolvedUserId }),
		verifyWebhook: async () => true,
		...overrides,
	}
}

function buildApp(adapters: Map<string, ChatAdapter>, service: HandleInboundMessage) {
	let app = new Hono()
	app.route('/webhook', createWebhookRouter(adapters, service))
	return app
}

describe('webhook router', () => {
	test('POST /webhook/:provider returns 200 on success', async () => {
		let adapters = new Map([['test', createMockAdapter()]])
		let service = new HandleInboundMessage()
		let app = buildApp(adapters, service)

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ some: 'data' }),
			}),
		)

		expect(res.status).toBe(200)
		let body = await res.json()
		expect(body.ok).toBe(true)
	})

	test('POST /webhook/:provider returns 404 for unknown provider', async () => {
		let adapters = new Map<string, ChatAdapter>()
		let service = new HandleInboundMessage()
		let app = buildApp(adapters, service)

		let res = await app.fetch(
			new Request('http://localhost/webhook/unknown', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}),
		)

		expect(res.status).toBe(404)
	})

	test('POST /webhook/:provider returns 401 when verifyWebhook fails', async () => {
		let adapter = createMockAdapter({ verifyWebhook: async () => false })
		let adapters = new Map([['test', adapter]])
		let service = new HandleInboundMessage()
		let app = buildApp(adapters, service)

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}),
		)

		expect(res.status).toBe(401)
	})

	test('POST /webhook/:provider returns 400 when service throws parse error', async () => {
		let adapter = createMockAdapter({
			parseInbound: async () => {
				throw new Error('invalid payload')
			},
		})
		let adapters = new Map([['test', adapter]])
		let service = new HandleInboundMessage()
		let app = buildApp(adapters, service)

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}),
		)

		expect(res.status).toBe(400)
	})
})
