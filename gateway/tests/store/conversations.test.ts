import { describe, test, expect, mock, beforeEach } from 'bun:test'
import {
	createConversationStore,
	type ConversationStoreClient,
} from '../../src/store/conversations'

type FromFn = ConversationStoreClient['from']

function createMockSupabaseClient(overrides: { from?: FromFn } = {}): ConversationStoreClient {
	let defaultFrom: FromFn = (_table: string) => ({
		insert: () => Promise.resolve({ error: null }),
		select: () => ({
			eq: () => ({
				order: () => ({
					limit: () => Promise.resolve({ data: [], error: null }),
				}),
			}),
		}),
	})

	return { from: overrides.from || defaultFrom }
}

describe('ConversationStore', () => {
	let mockClient: ConversationStoreClient
	let store: ReturnType<typeof createConversationStore>

	beforeEach(() => {
		mockClient = createMockSupabaseClient()
		store = createConversationStore(mockClient)
	})

	describe('save', () => {
		test('inserts message with correct threadId, role, and content', async () => {
			let insertMock = mock(() => Promise.resolve({ error: null }))
			mockClient = createMockSupabaseClient({
				from: (_table: string) => ({
					insert: insertMock,
					select: () => ({
						eq: () => ({
							order: () => ({
								limit: () => Promise.resolve({ data: [], error: null }),
							}),
						}),
					}),
				}),
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
				from: (_table: string) => ({
					insert: () => Promise.resolve({ error: { message: 'insert failed' } }),
					select: () => ({
						eq: () => ({
							order: () => ({
								limit: () => Promise.resolve({ data: [], error: null }),
							}),
						}),
					}),
				}),
			})
			store = createConversationStore(mockClient)

			await expect(
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
				from: (_table: string) => ({
					insert: () => Promise.resolve({ error: null }),
					select: () => ({
						eq: () => ({
							order: () => ({
								limit: () => Promise.resolve({ data: mockMessages, error: null }),
							}),
						}),
					}),
				}),
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
			let limitMock = mock(() =>
				Promise.resolve({
					data: [
						{ id: '4', thread_id: 'thread-abc', role: 'user', content: 'msg4', provider: null, sender_id: null, created_at: '2026-01-01T00:00:04Z' },
						{ id: '5', thread_id: 'thread-abc', role: 'assistant', content: 'msg5', provider: null, sender_id: null, created_at: '2026-01-01T00:00:05Z' },
					],
					error: null,
				}),
			)

			mockClient = createMockSupabaseClient({
				from: (_table: string) => ({
					insert: () => Promise.resolve({ error: null }),
					select: () => ({
						eq: () => ({
							order: () => ({
								limit: limitMock,
							}),
						}),
					}),
				}),
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
				from: (_table: string) => ({
					insert: () => Promise.resolve({ error: null }),
					select: () => ({
						eq: () => ({
							order: () => ({
								limit: () => Promise.resolve({ data: null, error: { message: 'query failed' } }),
							}),
						}),
					}),
				}),
			})
			store = createConversationStore(mockClient)

			await expect(store.getHistory('thread-abc', 10)).rejects.toThrow('query failed')
		})
	})
})
