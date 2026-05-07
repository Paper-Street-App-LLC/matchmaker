import type { ConversationStoreClient } from '../../src/store/conversations'

export type RecordedInsert = {
	thread_id: string
	role: string
	content: string
	provider: string | null
	sender_id: string | null
}

export function createInMemoryStoreClient(): {
	client: ConversationStoreClient
	inserts: RecordedInsert[]
} {
	let inserts: RecordedInsert[] = []

	let client: ConversationStoreClient = {
		from(_table: string) {
			return {
				insert(values) {
					inserts.push({
						thread_id: String(values.thread_id),
						role: String(values.role),
						content: String(values.content),
						provider: values.provider == null ? null : String(values.provider),
						sender_id: values.sender_id == null ? null : String(values.sender_id),
					})
					return Promise.resolve({ error: null })
				},
				select(_columns: string) {
					let rows = inserts.map((row, i) => ({
						id: String(i + 1),
						thread_id: row.thread_id,
						role: row.role,
						content: row.content,
						provider: row.provider,
						sender_id: row.sender_id,
						created_at: new Date(1700000000000 + i).toISOString(),
					}))
					return {
						eq(_column: string, value: string) {
							let filtered = rows.filter(r => r.thread_id === value)
							return {
								order(_column: string, _opts: { ascending: boolean }) {
									return {
										limit(count: number) {
											return Promise.resolve({
												data: filtered.slice(0, count),
												error: null,
											})
										},
									}
								},
							}
						},
					}
				},
			}
		},
	}

	return { client, inserts }
}
