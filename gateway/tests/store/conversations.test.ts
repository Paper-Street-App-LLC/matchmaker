import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
	createConversationStore,
	createSupabaseConversationDb,
	type ConversationDb,
	type DbRow,
} from '../../src/store/conversations'

type FromShape = {
	insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
	select: (columns: string) => {
		eq: (
			column: string,
			value: string,
		) => {
			order: (
				column: string,
				opts: { ascending: boolean },
			) => {
				limit: (
					count: number,
				) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
			}
		}
	}
}

function asSupabase(client: { from: (table: string) => FromShape }): SupabaseClient {
	return client as unknown as SupabaseClient
}

function makeStubDb(overrides: Partial<ConversationDb> = {}): ConversationDb {
	return {
		insert: async () => {},
		selectByThread: async () => [],
		...overrides,
	}
}

describe('createConversationStore', () => {
	let store: ReturnType<typeof createConversationStore>

	describe('save', () => {
		test('forwards camelCase fields to db.insert as snake_case row', async () => {
			let inserts: Parameters<ConversationDb['insert']>[0][] = []
			store = createConversationStore(
				makeStubDb({
					insert: async row => {
						inserts.push(row)
					},
				}),
			)

			await store.save({
				threadId: 'thread-abc',
				role: 'user',
				content: 'Hello matchmaker',
				provider: 'telegram',
				senderId: '12345',
			})

			expect(inserts).toHaveLength(1)
			expect(inserts[0]).toEqual({
				thread_id: 'thread-abc',
				role: 'user',
				content: 'Hello matchmaker',
				provider: 'telegram',
				sender_id: '12345',
			})
		})

		test('coerces missing optional fields to null', async () => {
			let inserts: Parameters<ConversationDb['insert']>[0][] = []
			store = createConversationStore(
				makeStubDb({
					insert: async row => {
						inserts.push(row)
					},
				}),
			)

			await store.save({
				threadId: 'thread-abc',
				role: 'assistant',
				content: 'Hi there',
			})

			expect(inserts[0]).toMatchObject({
				provider: null,
				sender_id: null,
			})
		})

		test('propagates db.insert errors', async () => {
			store = createConversationStore(
				makeStubDb({
					insert: async () => {
						throw new Error('insert failed')
					},
				}),
			)

			await expect(
				store.save({
					threadId: 'thread-abc',
					role: 'user',
					content: 'Hello',
				}),
			).rejects.toThrow('insert failed')
		})
	})

	describe('getHistory', () => {
		test('asks db.selectByThread for the thread with the given limit', async () => {
			let calls: { threadId: string; limit: number }[] = []
			store = createConversationStore(
				makeStubDb({
					selectByThread: async (threadId, limit) => {
						calls.push({ threadId, limit })
						return []
					},
				}),
			)

			await store.getHistory('thread-abc', 25)

			expect(calls).toEqual([{ threadId: 'thread-abc', limit: 25 }])
		})

		test('maps DbRow[] to ConversationMessage[] preserving order', async () => {
			store = createConversationStore(
				makeStubDb({
					selectByThread: async () => [
						{
							id: '1',
							thread_id: 'thread-abc',
							role: 'user',
							content: 'Hello',
							provider: 'telegram',
							sender_id: '123',
							created_at: '2026-01-01T00:00:00Z',
						},
						{
							id: '2',
							thread_id: 'thread-abc',
							role: 'assistant',
							content: 'Hi there',
							provider: null,
							sender_id: null,
							created_at: '2026-01-01T00:00:01Z',
						},
					],
				}),
			)

			let history = await store.getHistory('thread-abc', 10)

			expect(history).toHaveLength(2)
			expect(history[0]).toEqual({
				id: '1',
				threadId: 'thread-abc',
				role: 'user',
				content: 'Hello',
				provider: 'telegram',
				senderId: '123',
				createdAt: '2026-01-01T00:00:00Z',
			})
			expect(history[1]).toEqual({
				id: '2',
				threadId: 'thread-abc',
				role: 'assistant',
				content: 'Hi there',
				provider: undefined,
				senderId: undefined,
				createdAt: '2026-01-01T00:00:01Z',
			})
		})

		test('returns empty array when db returns no rows', async () => {
			store = createConversationStore(makeStubDb())

			let history = await store.getHistory('thread-new', 10)

			expect(history).toEqual([])
		})

		test('propagates db.selectByThread errors', async () => {
			store = createConversationStore(
				makeStubDb({
					selectByThread: async () => {
						throw new Error('query failed')
					},
				}),
			)

			await expect(store.getHistory('thread-abc', 10)).rejects.toThrow('query failed')
		})
	})
})

type FromFn = (table: string) => FromShape

function createMockSupabaseClient(overrides: { from?: FromFn } = {}) {
	let defaultFrom: FromFn = () => ({
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

describe('createSupabaseConversationDb', () => {
	let mockClient: ReturnType<typeof createMockSupabaseClient>

	beforeEach(() => {
		mockClient = createMockSupabaseClient()
	})

	test('insert() forwards the row to client.from("conversations").insert()', async () => {
		let insertMock = mock((_data: Record<string, unknown>) =>
			Promise.resolve({ error: null }),
		)
		let fromMock = mock((_table: string) => ({
			insert: insertMock,
			select: () => ({
				eq: () => ({
					order: () => ({
						limit: () => Promise.resolve({ data: [], error: null }),
					}),
				}),
			}),
		}))
		mockClient = { from: fromMock as unknown as FromFn }
		let db = createSupabaseConversationDb(asSupabase(mockClient))

		await db.insert({
			thread_id: 'thread-abc',
			role: 'user',
			content: 'Hello',
			provider: 'telegram',
			sender_id: '12345',
		})

		expect(fromMock).toHaveBeenCalledWith('conversations')
		expect(insertMock).toHaveBeenCalledTimes(1)
		expect(insertMock.mock.calls[0]?.[0]).toEqual({
			thread_id: 'thread-abc',
			role: 'user',
			content: 'Hello',
			provider: 'telegram',
			sender_id: '12345',
		})
	})

	test('insert() throws when Supabase returns an error', async () => {
		mockClient = createMockSupabaseClient({
			from: () => ({
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
		let db = createSupabaseConversationDb(asSupabase(mockClient))

		await expect(
			db.insert({
				thread_id: 'thread-abc',
				role: 'user',
				content: 'Hello',
				provider: null,
				sender_id: null,
			}),
		).rejects.toThrow('insert failed')
	})

	test('selectByThread() chains select → eq(thread_id) → order(created_at asc) → limit', async () => {
		let calls = {
			select: '' as string,
			eqColumn: '' as string,
			eqValue: '' as string,
			orderColumn: '' as string,
			orderAscending: false,
			limit: 0,
		}
		mockClient = createMockSupabaseClient({
			from: () => ({
				insert: () => Promise.resolve({ error: null }),
				select: (columns: string) => {
					calls.select = columns
					return {
						eq: (column: string, value: string) => {
							calls.eqColumn = column
							calls.eqValue = value
							return {
								order: (column: string, opts: { ascending: boolean }) => {
									calls.orderColumn = column
									calls.orderAscending = opts.ascending
									return {
										limit: (count: number) => {
											calls.limit = count
											return Promise.resolve({ data: [], error: null })
										},
									}
								},
							}
						},
					}
				},
			}),
		})
		let db = createSupabaseConversationDb(asSupabase(mockClient))

		await db.selectByThread('thread-abc', 7)

		expect(calls).toEqual({
			select: '*',
			eqColumn: 'thread_id',
			eqValue: 'thread-abc',
			orderColumn: 'created_at',
			orderAscending: true,
			limit: 7,
		})
	})

	test('selectByThread() returns parsed DbRow[] from Supabase', async () => {
		let supabaseRows: DbRow[] = [
			{
				id: '1',
				thread_id: 'thread-abc',
				role: 'user',
				content: 'Hello',
				provider: 'telegram',
				sender_id: '123',
				created_at: '2026-01-01T00:00:00Z',
			},
		]
		mockClient = createMockSupabaseClient({
			from: () => ({
				insert: () => Promise.resolve({ error: null }),
				select: () => ({
					eq: () => ({
						order: () => ({
							limit: () => Promise.resolve({ data: supabaseRows, error: null }),
						}),
					}),
				}),
			}),
		})
		let db = createSupabaseConversationDb(asSupabase(mockClient))

		let rows = await db.selectByThread('thread-abc', 10)

		expect(rows).toEqual(supabaseRows)
	})

	test('selectByThread() throws when Supabase returns an error', async () => {
		mockClient = createMockSupabaseClient({
			from: () => ({
				insert: () => Promise.resolve({ error: null }),
				select: () => ({
					eq: () => ({
						order: () => ({
							limit: () =>
								Promise.resolve({ data: null, error: { message: 'query failed' } }),
						}),
					}),
				}),
			}),
		})
		let db = createSupabaseConversationDb(asSupabase(mockClient))

		await expect(db.selectByThread('thread-abc', 10)).rejects.toThrow('query failed')
	})
})
