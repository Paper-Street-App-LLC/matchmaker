import { describe, test, expect } from 'bun:test'
import type { ChatAdapter } from '../../src/types/adapter'
import type { InboundMessage, OutboundMessage, RawInboundMessage } from '../../src/types/messages'
import {
	HandleInboundMessage,
	type ProcessMessage,
} from '../../src/services/handle-inbound-message'
import { InboundParseError } from '../../src/services/errors'

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

function stubProcessMessage(reply = 'AI response'): {
	processMessage: ProcessMessage
	calls: InboundMessage[]
} {
	let calls: InboundMessage[] = []
	let processMessage: ProcessMessage = async input => {
		calls.push(input.inbound)
		return reply
	}
	return { processMessage, calls }
}

describe('HandleInboundMessage', () => {
	test('calls parseInbound on the adapter with raw payload', async () => {
		let { adapter, parseInboundCalls } = createMockAdapter()
		let { processMessage } = stubProcessMessage()
		let service = new HandleInboundMessage({ processMessage })
		let rawPayload = { some: 'data' }

		await service.execute(adapter, rawPayload)

		expect(parseInboundCalls).toHaveLength(1)
		expect(parseInboundCalls[0]).toBe(rawPayload)
	})

	test('calls resolveUser with the parsed senderId', async () => {
		let { adapter, resolveUserCalls } = createMockAdapter()
		let { processMessage } = stubProcessMessage()
		let service = new HandleInboundMessage({ processMessage })

		await service.execute(adapter, {})

		expect(resolveUserCalls).toHaveLength(1)
		expect(resolveUserCalls[0]).toBe('sender-123')
	})

	test('runs the inbound message through the AI core after resolving the user', async () => {
		let { adapter } = createMockAdapter()
		let { processMessage, calls } = stubProcessMessage('AI response text')
		let service = new HandleInboundMessage({ processMessage })

		await service.execute(adapter, {})

		expect(calls).toHaveLength(1)
		let inbound = calls[0]!
		expect(inbound.userId).toBe(resolvedUserId)
		expect(inbound.text).toBe('hello')
		expect(inbound.provider).toBe('test')
		expect(inbound.senderId).toBe('sender-123')
		expect(inbound.threadId).toBe('thread-456')
	})

	test('replies with the AI core response (not a hard-coded ack)', async () => {
		let { adapter, sendReplyCalls } = createMockAdapter()
		let { processMessage } = stubProcessMessage('Hi Alex, tell me more.')
		let service = new HandleInboundMessage({ processMessage })

		await service.execute(adapter, {})

		expect(sendReplyCalls).toHaveLength(1)
		let firstCall = sendReplyCalls[0]!
		expect(firstCall.provider).toBe('test')
		expect(firstCall.senderId).toBe('sender-123')
		expect(firstCall.threadId).toBe('thread-456')
		expect(firstCall.text).toBe('Hi Alex, tell me more.')
	})

	test('returns a fully-hydrated InboundMessage with resolved userId', async () => {
		let { adapter } = createMockAdapter()
		let { processMessage } = stubProcessMessage()
		let service = new HandleInboundMessage({ processMessage })

		let result = await service.execute(adapter, {})

		expect(result.provider).toBe(validRaw.provider)
		expect(result.senderId).toBe(validRaw.senderId)
		expect(result.text).toBe(validRaw.text)
		expect(result.threadId).toBe(validRaw.threadId)
		expect(result.timestamp).toBe(validRaw.timestamp)
		expect(result.userId).toBe(resolvedUserId)
	})

	test('wraps parseInbound failures in InboundParseError', async () => {
		let { adapter } = createMockAdapter({
			parseInbound: async () => {
				throw new Error('bad payload')
			},
		})
		let { processMessage } = stubProcessMessage()
		let service = new HandleInboundMessage({ processMessage })

		await expect(service.execute(adapter, {})).rejects.toBeInstanceOf(InboundParseError)
	})

	test('propagates resolveUser failures untouched (not as InboundParseError)', async () => {
		let { adapter } = createMockAdapter({
			resolveUser: async () => {
				throw new Error('user directory down')
			},
		})
		let { processMessage } = stubProcessMessage()
		let service = new HandleInboundMessage({ processMessage })

		let caught: unknown = null
		try {
			await service.execute(adapter, {})
		} catch (err) {
			caught = err
		}

		expect(caught).toBeInstanceOf(Error)
		expect(caught).not.toBeInstanceOf(InboundParseError)
	})

	test('propagates sendReply failures untouched (not as InboundParseError)', async () => {
		let { adapter } = createMockAdapter({
			sendReply: async () => {
				throw new Error('chat provider timeout')
			},
		})
		let { processMessage } = stubProcessMessage()
		let service = new HandleInboundMessage({ processMessage })

		let caught: unknown = null
		try {
			await service.execute(adapter, {})
		} catch (err) {
			caught = err
		}

		expect(caught).toBeInstanceOf(Error)
		expect(caught).not.toBeInstanceOf(InboundParseError)
	})

	test('propagates processMessage failures untouched (not as InboundParseError)', async () => {
		let { adapter } = createMockAdapter()
		let processMessage: ProcessMessage = async () => {
			throw new Error('AI core blew up')
		}
		let service = new HandleInboundMessage({ processMessage })

		let caught: unknown = null
		try {
			await service.execute(adapter, {})
		} catch (err) {
			caught = err
		}

		expect(caught).toBeInstanceOf(Error)
		expect(caught).not.toBeInstanceOf(InboundParseError)
	})
})
