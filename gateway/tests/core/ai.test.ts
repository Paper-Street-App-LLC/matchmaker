import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { processMessage, type MessageCreateFn, type Deps } from '../../src/core/ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'

let createMockSupabase = (): SupabaseClient => ({}) as unknown as SupabaseClient

let savedMessages: { threadId: string; role: string; content: unknown }[] = []

let mockDeps = (): Deps => ({
	save: mock(async (_client, params) => {
		savedMessages.push(params)
		return {
			...params,
			id: 'msg-1',
			thread_id: params.threadId,
			created_at: new Date().toISOString(),
		} as any
	}),
	getHistory: mock(async () => []),
	executeTool: mock(async () => ({
		content: JSON.stringify([{ id: 'p1', name: 'Alice' }]),
	})),
})

let createMockCreateMessage = (
	responses: Partial<Anthropic.Message>[]
): MessageCreateFn => {
	let callIndex = 0
	return mock(async (_params: Anthropic.MessageCreateParamsNonStreaming) => {
		let response = responses[callIndex] ?? responses[responses.length - 1]
		callIndex++
		return {
			id: 'msg-1',
			type: 'message' as const,
			role: 'assistant' as const,
			model: 'claude-sonnet-4-20250514',
			usage: {
				input_tokens: 100,
				output_tokens: 50,
				cache_read_input_tokens: 0,
				cache_creation_input_tokens: 0,
			},
			stop_reason: 'end_turn',
			content: [],
			...response,
		} as Anthropic.Message
	})
}

beforeEach(() => {
	savedMessages = []
})

describe('processMessage', () => {
	test('returns text response for simple message', async () => {
		let createMessage = createMockCreateMessage([
			{
				stop_reason: 'end_turn',
				content: [{ type: 'text', text: 'Hello! How can I help you find a match?' }],
			},
		])
		let deps = { ...mockDeps(), createMessage }

		let result = await processMessage({
			text: 'Hi there',
			threadId: 'test:123',
			userId: 'user-1',
			supabaseClient: createMockSupabase(),
			deps,
		})

		expect(result).toBe('Hello! How can I help you find a match?')
	})

	test('saves user and assistant messages to conversation store', async () => {
		let createMessage = createMockCreateMessage([
			{
				stop_reason: 'end_turn',
				content: [{ type: 'text', text: 'Hi!' }],
			},
		])
		let deps = { ...mockDeps(), createMessage }

		await processMessage({
			text: 'Hi there',
			threadId: 'test:123',
			userId: 'user-1',
			supabaseClient: createMockSupabase(),
			deps,
		})

		expect(savedMessages).toHaveLength(2)
		expect(savedMessages[0]!.role).toBe('user')
		expect(savedMessages[0]!.content).toBe('Hi there')
		expect(savedMessages[1]!.role).toBe('assistant')
		expect(savedMessages[1]!.content).toBe('Hi!')
	})

	test('calls Anthropic API with system prompt and tools', async () => {
		let createMessage = createMockCreateMessage([
			{
				stop_reason: 'end_turn',
				content: [{ type: 'text', text: 'Hello' }],
			},
		])
		let deps = { ...mockDeps(), createMessage }

		await processMessage({
			text: 'Hello',
			threadId: 'test:456',
			userId: 'user-1',
			supabaseClient: createMockSupabase(),
			deps,
		})

		expect(createMessage).toHaveBeenCalled()
		let callArgs = (createMessage as ReturnType<typeof mock>).mock.calls[0]![0] as Record<
			string,
			unknown
		>
		expect(callArgs.system).toBeDefined()
		expect(callArgs.tools).toBeDefined()
		expect(callArgs.messages).toBeDefined()
	})

	test('handles tool-calling loop', async () => {
		let createMessage = createMockCreateMessage([
			{
				stop_reason: 'tool_use',
				content: [
					{ type: 'text', text: 'Let me look up your people.' },
					{
						type: 'tool_use',
						id: 'call-1',
						name: 'list_people',
						input: {},
					},
				],
			},
			{
				stop_reason: 'end_turn',
				content: [{ type: 'text', text: 'You have 1 person: Alice.' }],
			},
		])
		let deps = { ...mockDeps(), createMessage }

		let result = await processMessage({
			text: 'List my people',
			threadId: 'test:789',
			userId: 'user-1',
			supabaseClient: createMockSupabase(),
			deps,
		})

		expect(result).toBe('You have 1 person: Alice.')
		expect(createMessage).toHaveBeenCalledTimes(2)
	})

	test('handles response with no text blocks', async () => {
		let createMessage = createMockCreateMessage([
			{
				stop_reason: 'end_turn',
				content: [],
			},
		])
		let deps = { ...mockDeps(), createMessage }

		let result = await processMessage({
			text: 'Hi',
			threadId: 'test:empty',
			userId: 'user-1',
			supabaseClient: createMockSupabase(),
			deps,
		})

		expect(result).toBe('')
	})
})
