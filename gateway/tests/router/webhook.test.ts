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
		let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
		let app = buildApp(adapters, service)

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ some: 'data' }),
			}),
		)

		expect(res.status).toBe(200)
		let body: { ok?: boolean } = JSON.parse(await res.text())
		expect(body.ok).toBe(true)
	})

	test('POST /webhook/:provider returns 404 for unknown provider', async () => {
		let adapters = new Map<string, ChatAdapter>()
		let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
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
		let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
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

	test('verifyWebhook receives headers and body buffer without consuming the request stream', async () => {
		let captured: { bodyText: string | null; signature: string | null } = {
			bodyText: null,
			signature: null,
		}
		let adapter = createMockAdapter({
			verifyWebhook: async ({ headers, body }) => {
				captured.bodyText = new TextDecoder().decode(body)
				captured.signature = headers.get('x-signature')
				return true
			},
		})
		let adapters = new Map([['test', adapter]])
		let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
		let app = buildApp(adapters, service)

		let payload = JSON.stringify({ some: 'data' })
		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Signature': 'sig-xyz',
				},
				body: payload,
			}),
		)

		expect(res.status).toBe(200)
		expect(captured.bodyText).toBe(payload)
		expect(captured.signature).toBe('sig-xyz')
	})

	test('POST /webhook/:provider returns 400 when parseInbound throws', async () => {
		let adapter = createMockAdapter({
			parseInbound: async () => {
				throw new Error('invalid payload')
			},
		})
		let adapters = new Map([['test', adapter]])
		let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
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

	test('POST /webhook/:provider does not return 400 when sendReply fails', async () => {
		let adapter = createMockAdapter({
			sendReply: async () => {
				throw new Error('upstream chat provider is down')
			},
		})
		let adapters = new Map([['test', adapter]])
		let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
		let app = buildApp(adapters, service)
		app.onError((_err, c) => c.json({ error: 'Internal server error' }, 500))

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}),
		)

		expect(res.status).toBe(500)
	})

	test('POST /webhook/:provider does not return 400 when resolveUser fails', async () => {
		let adapter = createMockAdapter({
			resolveUser: async () => {
				throw new Error('user directory unavailable')
			},
		})
		let adapters = new Map([['test', adapter]])
		let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
		let app = buildApp(adapters, service)
		app.onError((_err, c) => c.json({ error: 'Internal server error' }, 500))

		let res = await app.fetch(
			new Request('http://localhost/webhook/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			}),
		)

		expect(res.status).toBe(500)
	})
})
