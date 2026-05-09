import { describe, test, expect } from 'bun:test'
import { z } from 'zod'
import { createApp } from '../src/app'
import { processMessage as runAiCore } from '../src/core/ai'
import { createConversationStore } from '../src/store/conversations'
import {
	HandleInboundMessage,
	type ProcessMessage,
} from '../src/services/handle-inbound-message'
import type { ChatAdapter } from '../src/types/adapter'
import type { OutboundMessage, RawInboundMessage } from '../src/types/messages'
import { createInMemoryConversationDb } from './helpers/in-memory-store'

let healthSchema = z.object({
	status: z.string(),
	timestamp: z.string(),
})

function buildEmptyApp() {
	let adapters = new Map<string, ChatAdapter>()
	let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
	return createApp({ adapters, service })
}

describe('Gateway', () => {
	describe('Public Routes', () => {
		test('GET /health returns 200 with healthy status', async () => {
			let app = buildEmptyApp()
			let res = await app.fetch(new Request('http://localhost/health'))

			expect(res.status).toBe(200)

			let json = (await res.json()) as { status: string; timestamp: string }
			let data = healthSchema.parse(json)

			expect(data.status).toBe('healthy')
			expect(data.timestamp).toBeDefined()
		})

		test('GET /nonexistent returns 404', async () => {
			let app = buildEmptyApp()
			let res = await app.fetch(new Request('http://localhost/nonexistent'))

			expect(res.status).toBe(404)
		})
	})

	describe('Webhook mount', () => {
		test('POST /webhook/:provider routes through the webhook router (unknown provider → 404)', async () => {
			let app = buildEmptyApp()
			let res = await app.fetch(
				new Request('http://localhost/webhook/unknown', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
				}),
			)

			expect(res.status).toBe(404)
			let body = (await res.json()) as { error?: string }
			expect(body.error).toBe('Unknown provider')
		})
	})

	describe('Conversation persistence (BDD acceptance)', () => {
		test('persists user + assistant turn with shared threadId after webhook POST', async () => {
			let validRaw: RawInboundMessage = {
				provider: 'test',
				senderId: 'sender-123',
				text: 'hello matchmaker',
				threadId: 'thread-abc',
				timestamp: 1711900000000,
			}
			let resolvedUserId = '550e8400-e29b-41d4-a716-446655440000'

			let sendReplyCalls: OutboundMessage[] = []
			let adapter: ChatAdapter = {
				provider: 'test',
				parseInbound: async () => validRaw,
				sendReply: async msg => {
					sendReplyCalls.push(msg)
				},
				resolveUser: async () => ({ userId: resolvedUserId }),
				verifyWebhook: async () => true,
			}

			let { db, inserts } = createInMemoryConversationDb()
			let store = createConversationStore(db)

			let stubGenerateText = (async () => ({
				text: 'AI reply text',
			})) as unknown as typeof import('ai').generateText

			let processMessage: ProcessMessage = async ({ inbound }) =>
				runAiCore(
					{ inbound },
					{ store, tools: {}, generateText: stubGenerateText },
				)

			let service = new HandleInboundMessage({ processMessage })
			let app = createApp({ adapters: new Map([['test', adapter]]), service })

			let res = await app.fetch(
				new Request('http://localhost/webhook/test', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ raw: 'payload' }),
				}),
			)

			expect(res.status).toBe(200)
			let body = (await res.json()) as { ok: boolean; threadId: string }
			expect(body).toEqual({ ok: true, threadId: 'thread-abc' })

			expect(inserts).toHaveLength(2)
			let [userTurn, assistantTurn] = inserts
			expect(userTurn).toMatchObject({
				thread_id: 'thread-abc',
				role: 'user',
				content: 'hello matchmaker',
				provider: 'test',
				sender_id: 'sender-123',
			})
			expect(assistantTurn).toMatchObject({
				thread_id: 'thread-abc',
				role: 'assistant',
				content: 'AI reply text',
			})
			expect(userTurn!.thread_id).toBe(assistantTurn!.thread_id)

			expect(sendReplyCalls).toHaveLength(1)
			expect(sendReplyCalls[0]!.text).toBe('AI reply text')
			expect(sendReplyCalls[0]!.threadId).toBe('thread-abc')
		})
	})
})
