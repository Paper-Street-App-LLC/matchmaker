import { describe, test, expect } from 'bun:test'
import type { ChatAdapter } from '../../src/types/adapter'
import type { OutboundMessage, RawInboundMessage } from '../../src/types/messages'
import { HandleInboundMessage } from '../../src/services/handle-inbound-message'

let validRaw: RawInboundMessage = {
	provider: 'test',
	senderId: 'sender-123',
	text: 'hello',
	threadId: 'thread-456',
	timestamp: 1711900000000,
}

let resolvedUserId = '550e8400-e29b-41d4-a716-446655440000'

function createMockAdapter(overrides: Partial<ChatAdapter> = {}) {
	let parseInboundCalls: unknown[] = []
	let resolveUserCalls: string[] = []
	let sendReplyCalls: OutboundMessage[] = []

	let adapter: ChatAdapter = {
		provider: 'test',
		parseInbound: async (raw: unknown) => {
			parseInboundCalls.push(raw)
			return validRaw
		},
		sendReply: async (msg: OutboundMessage) => {
			sendReplyCalls.push(msg)
		},
		resolveUser: async (senderId: string) => {
			resolveUserCalls.push(senderId)
			return { userId: resolvedUserId }
		},
		verifyWebhook: async () => true,
		...overrides,
	}

	return { adapter, parseInboundCalls, resolveUserCalls, sendReplyCalls }
}

describe('HandleInboundMessage', () => {
	test('calls parseInbound on the adapter with raw payload', async () => {
		let { adapter, parseInboundCalls } = createMockAdapter()
		let service = new HandleInboundMessage()
		let rawPayload = { some: 'data' }

		await service.execute(adapter, rawPayload)

		expect(parseInboundCalls).toHaveLength(1)
		expect(parseInboundCalls[0]).toBe(rawPayload)
	})

	test('calls resolveUser with the parsed senderId', async () => {
		let { adapter, resolveUserCalls } = createMockAdapter()
		let service = new HandleInboundMessage()

		await service.execute(adapter, {})

		expect(resolveUserCalls).toHaveLength(1)
		expect(resolveUserCalls[0]).toBe('sender-123')
	})

	test('calls sendReply with correct provider, senderId, and threadId', async () => {
		let { adapter, sendReplyCalls } = createMockAdapter()
		let service = new HandleInboundMessage()

		await service.execute(adapter, {})

		expect(sendReplyCalls).toHaveLength(1)
		expect(sendReplyCalls[0].provider).toBe('test')
		expect(sendReplyCalls[0].senderId).toBe('sender-123')
		expect(sendReplyCalls[0].threadId).toBe('thread-456')
		expect(sendReplyCalls[0].text.length).toBeGreaterThan(0)
	})

	test('returns a fully-hydrated InboundMessage with resolved userId', async () => {
		let { adapter } = createMockAdapter()
		let service = new HandleInboundMessage()

		let result = await service.execute(adapter, {})

		expect(result.provider).toBe(validRaw.provider)
		expect(result.senderId).toBe(validRaw.senderId)
		expect(result.text).toBe(validRaw.text)
		expect(result.threadId).toBe(validRaw.threadId)
		expect(result.timestamp).toBe(validRaw.timestamp)
		expect(result.userId).toBe(resolvedUserId)
	})

	test('propagates error when parseInbound throws', async () => {
		let { adapter } = createMockAdapter({
			parseInbound: async () => {
				throw new Error('bad payload')
			},
		})
		let service = new HandleInboundMessage()

		await expect(service.execute(adapter, {})).rejects.toThrow('bad payload')
	})
})
