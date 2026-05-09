import type {
	ConversationDb,
	ConversationInsertRow,
	DbRow,
} from '../../src/store/conversations'

export type RecordedInsert = ConversationInsertRow

export function createInMemoryConversationDb(): {
	db: ConversationDb
	inserts: RecordedInsert[]
} {
	let inserts: RecordedInsert[] = []
	let baseTime = 1700000000000

	let db: ConversationDb = {
		async insert(row) {
			inserts.push(row)
		},

		async selectByThread(threadId, limit) {
			let rows: DbRow[] = inserts
				.map((row, i) => ({
					id: String(i + 1),
					thread_id: row.thread_id,
					role: row.role,
					content: row.content,
					provider: row.provider,
					sender_id: row.sender_id,
					created_at: new Date(baseTime + i).toISOString(),
				}))
				.filter(r => r.thread_id === threadId)

			return rows.slice(0, limit)
		},
	}

	return { db, inserts }
}
