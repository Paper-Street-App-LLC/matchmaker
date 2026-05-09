import { describe, test, expect, mock } from 'bun:test'
import type { ConversationMessage } from '../../src/store/conversations'
import type { InboundMessage } from '../../src/types/messages'
import type { ConversationStore, GenerateTextFn } from '../../src/core/ai'
import { processMessage } from '../../src/core/ai'

function createStoreMock(history: ConversationMessage[] = []) {
	let getHistory = mock<ConversationStore['getHistory']>(async () => history)
	let save = mock<ConversationStore['save']>(async () => {})
	let store: ConversationStore = { getHistory, save }
	return { store, getHistory, save }
}

function createGenerateText(reply: string): {
	generateText: GenerateTextFn
	calls: unknown[]
} {
	let calls: unknown[] = []
	let generateText = (async (params: unknown) => {
		calls.push(params)
		return { text: reply, steps: [], finishReason: 'stop' as const }
	}) as unknown as GenerateTextFn
	return { generateText, calls }
}

let baseInbound: InboundMessage = {
	provider: 'telegram',
	senderId: 'sender-1',
	threadId: 'thread-1',
	timestamp: 1_700_000_000_000,
	text: 'Hi, I am looking for a match',
	userId: '550e8400-e29b-41d4-a716-446655440000',
}

describe('processMessage', () => {
	test('simple text message returns a non-empty string response', async () => {
		let { store, save } = createStoreMock()
		let { generateText } = createGenerateText('Hello! Tell me about yourself.')

		let result = await processMessage(
			{ inbound: baseInbound },
			{ store, tools: {}, generateText },
		)

		expect(result.length).toBeGreaterThan(0)
		expect(result).toBe('Hello! Tell me about yourself.')
		// One save for user input, one for assistant reply
		expect(save).toHaveBeenCalledTimes(2)
	})

	test('persists user message before assistant reply with provider/sender metadata', async () => {
		let { store, save } = createStoreMock()
		let { generateText } = createGenerateText('Got it.')

		await processMessage({ inbound: baseInbound }, { store, tools: {}, generateText })

		let firstSave = save.mock.calls[0]?.[0] as Record<string, unknown>
		let secondSave = save.mock.calls[1]?.[0] as Record<string, unknown>

		expect(firstSave).toMatchObject({
			threadId: 'thread-1',
			role: 'user',
			content: 'Hi, I am looking for a match',
			provider: 'telegram',
			senderId: 'sender-1',
		})
		expect(secondSave).toMatchObject({
			threadId: 'thread-1',
			role: 'assistant',
			content: 'Got it.',
		})
	})

	test('passes prior conversation history to the model in chronological order', async () => {
		let priorMessages: ConversationMessage[] = [
			{
				id: '1',
				threadId: 'thread-1',
				role: 'user',
				content: 'My name is Alex',
				createdAt: '2026-04-01T00:00:00Z',
			},
			{
				id: '2',
				threadId: 'thread-1',
				role: 'assistant',
				content: 'Nice to meet you, Alex.',
				createdAt: '2026-04-01T00:00:01Z',
			},
		]
		let { store } = createStoreMock(priorMessages)
		let { generateText, calls } = createGenerateText('You said your name is Alex.')

		let inbound = { ...baseInbound, text: 'What did I say earlier?' }
		await processMessage({ inbound }, { store, tools: {}, generateText })

		let params = calls[0] as { messages: { role: string; content: string }[] }
		expect(params.messages).toEqual([
			{ role: 'user', content: 'My name is Alex' },
			{ role: 'assistant', content: 'Nice to meet you, Alex.' },
			{ role: 'user', content: 'What did I say earlier?' },
		])
	})

	test('exposes the matchmaker tools to generateText so tool calls are possible', async () => {
		let { store } = createStoreMock()
		let { generateText, calls } = createGenerateText('Here are your people: ...')
		let toolStub = { list_people: { description: 'stub', inputSchema: {}, execute: async () => '' } }

		await processMessage(
			{ inbound: { ...baseInbound, text: 'List all my people' } },
			{ store, tools: toolStub as never, generateText },
		)

		let params = calls[0] as { tools: Record<string, unknown>; stopWhen: unknown }
		expect(params.tools).toBe(toolStub)
		expect(params.stopWhen).toBeDefined()
	})

	test('produces identical model input for telegram vs whatsapp with the same text (transport-agnostic)', async () => {
		let store1 = createStoreMock()
		let gen1 = createGenerateText('hi')
		let store2 = createStoreMock()
		let gen2 = createGenerateText('hi')

		let telegram: InboundMessage = { ...baseInbound, provider: 'telegram', text: 'Help me' }
		let whatsapp: InboundMessage = { ...baseInbound, provider: 'whatsapp', text: 'Help me' }

		await processMessage(
			{ inbound: telegram },
			{ store: store1.store, tools: {}, generateText: gen1.generateText },
		)
		await processMessage(
			{ inbound: whatsapp },
			{ store: store2.store, tools: {}, generateText: gen2.generateText },
		)

		let p1 = gen1.calls[0] as { messages: unknown; system: unknown; tools: unknown }
		let p2 = gen2.calls[0] as { messages: unknown; system: unknown; tools: unknown }

		expect(p1.messages).toEqual(p2.messages as never)
		expect(p1.system).toEqual(p2.system as never)
	})

	test('response text never references the inbound provider (transport-agnostic)', async () => {
		let { store } = createStoreMock()
		let { generateText } = createGenerateText('Of course, I can help.')

		let telegramResult = await processMessage(
			{ inbound: { ...baseInbound, provider: 'telegram' } },
			{ store, tools: {}, generateText },
		)
		let whatsappResult = await processMessage(
			{ inbound: { ...baseInbound, provider: 'whatsapp' } },
			{ store, tools: {}, generateText },
		)

		expect(telegramResult.toLowerCase()).not.toContain('telegram')
		expect(whatsappResult.toLowerCase()).not.toContain('whatsapp')
	})

	test('uses MATCHMAKER_INTERVIEW_TEXT as the system prompt by default', async () => {
		let { MATCHMAKER_INTERVIEW_TEXT } = await import('@matchmaker/shared')
		let { store } = createStoreMock()
		let { generateText, calls } = createGenerateText('ok')

		await processMessage({ inbound: baseInbound }, { store, tools: {}, generateText })

		let params = calls[0] as { system: string }
		expect(params.system).toBe(MATCHMAKER_INTERVIEW_TEXT)
	})

	test('skips system-role rows from history (only user/assistant flow into the model)', async () => {
		let priorMessages: ConversationMessage[] = [
			{
				id: 's1',
				threadId: 'thread-1',
				role: 'system',
				content: 'meta',
				createdAt: '2026-04-01T00:00:00Z',
			},
			{
				id: 'u1',
				threadId: 'thread-1',
				role: 'user',
				content: 'Hi',
				createdAt: '2026-04-01T00:00:01Z',
			},
		]
		let { store } = createStoreMock(priorMessages)
		let { generateText, calls } = createGenerateText('ok')

		await processMessage({ inbound: baseInbound }, { store, tools: {}, generateText })

		let params = calls[0] as { messages: { role: string; content: string }[] }
		expect(params.messages.find(m => m.role === 'system')).toBeUndefined()
	})
})
