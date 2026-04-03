import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createConversationStore } from '../../src/store/conversations'

function createMockSupabaseClient(overrides: { from?: any } = {}): SupabaseClient {
	let defaultFrom = mock((_table: string) => ({
		insert: mock(() => ({ error: null })),
		select: mock(() => ({
			eq: mock(() => ({
				order: mock(() => ({
					limit: mock(() => ({
						data: [],
						error: null,
					})),
					data: [],
					error: null,
				})),
			})),
		})),
	}))

	return { from: overrides.from || defaultFrom } as unknown as SupabaseClient
}

describe('ConversationStore', () => {
	let mockClient: SupabaseClient
	let store: ReturnType<typeof createConversationStore>

	beforeEach(() => {
		mockClient = createMockSupabaseClient()
		store = createConversationStore(mockClient)
	})

	describe('save', () => {
		test('inserts message with correct threadId, role, and content', async () => {
			let insertMock = mock(() => ({ error: null }))
			mockClient = createMockSupabaseClient({
				from: mock((_table: string) => ({
					insert: insertMock,
				})),
			})
			store = createConversationStore(mockClient)

			await store.save({
				threadId: 'thread-abc',
				role: 'user',
				content: 'Hello matchmaker',
				provider: 'telegram',
				senderId: '12345',
			})

			expect(insertMock).toHaveBeenCalledTimes(1)
			let insertedData = insertMock.mock.calls[0]![0] as Record<string, unknown>
			expect(insertedData.thread_id).toBe('thread-abc')
			expect(insertedData.role).toBe('user')
			expect(insertedData.content).toBe('Hello matchmaker')
			expect(insertedData.provider).toBe('telegram')
			expect(insertedData.sender_id).toBe('12345')
		})

		test('throws on Supabase error', async () => {
			mockClient = createMockSupabaseClient({
				from: mock((_table: string) => ({
					insert: mock(() => ({ error: { message: 'insert failed' } })),
				})),
			})
			store = createConversationStore(mockClient)

			expect(
				store.save({
					threadId: 'thread-abc',
					role: 'user',
					content: 'Hello',
				})
			).rejects.toThrow('insert failed')
		})
	})

	describe('getHistory', () => {
		test('returns messages ordered by created_at ascending', async () => {
			let mockMessages = [
				{ id: '1', thread_id: 'thread-abc', role: 'user', content: 'Hello', provider: 'telegram', sender_id: '123', created_at: '2026-01-01T00:00:00Z' },
				{ id: '2', thread_id: 'thread-abc', role: 'assistant', content: 'Hi there', provider: null, sender_id: null, created_at: '2026-01-01T00:00:01Z' },
			]

			mockClient = createMockSupabaseClient({
				from: mock((_table: string) => ({
					select: mock(() => ({
						eq: mock(() => ({
							order: mock(() => ({
								limit: mock(() => ({
									data: mockMessages,
									error: null,
								})),
							})),
						})),
					})),
				})),
			})
			store = createConversationStore(mockClient)

			let history = await store.getHistory('thread-abc', 10)

			expect(history).toHaveLength(2)
			expect(history[0]!.role).toBe('user')
			expect(history[0]!.content).toBe('Hello')
			expect(history[1]!.role).toBe('assistant')
			expect(history[1]!.content).toBe('Hi there')
		})

		test('respects limit parameter', async () => {
			let limitMock = mock(() => ({
				data: [
					{ id: '4', thread_id: 'thread-abc', role: 'user', content: 'msg4', provider: null, sender_id: null, created_at: '2026-01-01T00:00:04Z' },
					{ id: '5', thread_id: 'thread-abc', role: 'assistant', content: 'msg5', provider: null, sender_id: null, created_at: '2026-01-01T00:00:05Z' },
				],
				error: null,
			}))

			mockClient = createMockSupabaseClient({
				from: mock((_table: string) => ({
					select: mock(() => ({
						eq: mock(() => ({
							order: mock(() => ({
								limit: limitMock,
							})),
						})),
					})),
				})),
			})
			store = createConversationStore(mockClient)

			await store.getHistory('thread-abc', 2)

			expect(limitMock).toHaveBeenCalledWith(2)
		})

		test('returns empty array for thread with no messages', async () => {
			let history = await store.getHistory('thread-new', 10)

			expect(history).toEqual([])
		})

		test('throws on Supabase error', async () => {
			mockClient = createMockSupabaseClient({
				from: mock((_table: string) => ({
					select: mock(() => ({
						eq: mock(() => ({
							order: mock(() => ({
								limit: mock(() => ({
									data: null,
									error: { message: 'query failed' },
								})),
							})),
						})),
					})),
				})),
			})
			store = createConversationStore(mockClient)

			expect(store.getHistory('thread-abc', 10)).rejects.toThrow('query failed')
		})
	})
})
