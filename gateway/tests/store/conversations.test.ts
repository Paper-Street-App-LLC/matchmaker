import { describe, test, expect, mock } from 'bun:test'
import { save, getHistory } from '../../src/store/conversations'
import type { SupabaseClient } from '@supabase/supabase-js'

let createMockClient = (overrides: {
	insertResult?: { data: unknown; error: unknown }
	selectResult?: { data: unknown; error: unknown }
} = {}): SupabaseClient => {
	let defaultInsertResult = {
		data: {
			id: 'msg-1',
			thread_id: 'test:123',
			role: 'user',
			content: 'Hello',
			created_at: '2026-03-27T00:00:00Z',
		},
		error: null,
	}

	let defaultSelectResult = {
		data: [
			{ role: 'user', content: 'Hello', created_at: '2026-03-27T00:00:00Z' },
			{ role: 'assistant', content: 'Hi!', created_at: '2026-03-27T00:00:01Z' },
		],
		error: null,
	}

	let insertResult = overrides.insertResult ?? defaultInsertResult
	let selectResult = overrides.selectResult ?? defaultSelectResult

	let fromMock = mock((_table: string) => ({
		insert: mock(() => ({
			select: mock(() => ({
				single: mock(async () => insertResult),
			})),
		})),
		select: mock(() => ({
			eq: mock(() => ({
				order: mock(() => ({
					limit: mock(async () => selectResult),
				})),
			})),
		})),
	}))

	return { from: fromMock } as unknown as SupabaseClient
}

describe('save', () => {
	test('inserts a message into conversations table', async () => {
		let client = createMockClient()

		let result = await save(client, {
			threadId: 'test:123',
			role: 'user',
			content: 'Hello',
		})

		expect(result.thread_id).toBe('test:123')
		expect(client.from).toHaveBeenCalledWith('conversations')
	})

	test('saves with optional provider and senderId', async () => {
		let client = createMockClient({
			insertResult: {
				data: {
					id: 'msg-2',
					thread_id: 'telegram:456',
					role: 'user',
					content: 'Hello',
					provider: 'telegram',
					sender_id: '456',
					created_at: '2026-03-27T00:00:00Z',
				},
				error: null,
			},
		})

		let result = await save(client, {
			threadId: 'telegram:456',
			role: 'user',
			content: 'Hello',
			provider: 'telegram',
			senderId: '456',
		})

		expect(result.thread_id).toBe('telegram:456')
	})

	test('throws on insert error', async () => {
		let client = createMockClient({
			insertResult: { data: null, error: { message: 'insert failed' } },
		})

		await expect(
			save(client, { threadId: 'test:123', role: 'user', content: 'Hello' })
		).rejects.toThrow('Failed to save conversation message')
	})
})

describe('getHistory', () => {
	test('returns messages ordered by created_at', async () => {
		let client = createMockClient()

		let history = await getHistory(client, 'test:123', 10)

		expect(history).toHaveLength(2)
		expect(history[0]!.role).toBe('user')
		expect(history[1]!.role).toBe('assistant')
		expect(client.from).toHaveBeenCalledWith('conversations')
	})

	test('returns empty array for empty thread', async () => {
		let client = createMockClient({
			selectResult: { data: [], error: null },
		})

		let history = await getHistory(client, 'test:new', 10)

		expect(history).toHaveLength(0)
	})

	test('throws on select error', async () => {
		let client = createMockClient({
			selectResult: { data: null, error: { message: 'select failed' } },
		})

		await expect(getHistory(client, 'test:123', 10)).rejects.toThrow(
			'Failed to get conversation history'
		)
	})
})
