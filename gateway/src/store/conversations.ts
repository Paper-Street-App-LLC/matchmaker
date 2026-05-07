import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export type NewConversationMessage = {
	threadId: string
	role: 'user' | 'assistant' | 'system'
	content: string
	provider?: string
	senderId?: string
}

export type ConversationMessage = NewConversationMessage & {
	id: string
	createdAt: string
}

export let dbRowSchema = z.object({
	id: z.string(),
	thread_id: z.string(),
	role: z.enum(['user', 'assistant', 'system']),
	content: z.string(),
	provider: z.string().nullable(),
	sender_id: z.string().nullable(),
	created_at: z.string(),
})

export type DbRow = z.infer<typeof dbRowSchema>

export type ConversationInsertRow = {
	thread_id: string
	role: NewConversationMessage['role']
	content: string
	provider: string | null
	sender_id: string | null
}

export interface ConversationDb {
	insert(row: ConversationInsertRow): Promise<void>
	selectByThread(threadId: string, limit: number): Promise<DbRow[]>
}

export function createConversationStore(db: ConversationDb) {
	return {
		async save(message: NewConversationMessage) {
			await db.insert({
				thread_id: message.threadId,
				role: message.role,
				content: message.content,
				provider: message.provider ?? null,
				sender_id: message.senderId ?? null,
			})
		},

		async getHistory(threadId: string, limit: number): Promise<ConversationMessage[]> {
			let rows = await db.selectByThread(threadId, limit)
			return rows.map(toMessage)
		},
	}
}

function toMessage(row: DbRow): ConversationMessage {
	return {
		id: row.id,
		threadId: row.thread_id,
		role: row.role,
		content: row.content,
		provider: row.provider ?? undefined,
		senderId: row.sender_id ?? undefined,
		createdAt: row.created_at,
	}
}

export function createSupabaseConversationDb(
	client: SupabaseClient,
	table = 'conversations',
): ConversationDb {
	return {
		async insert(row) {
			let { error } = await client.from(table).insert(row)
			if (error) {
				throw new Error(error.message)
			}
		},

		async selectByThread(threadId, limit) {
			let { data, error } = await client
				.from(table)
				.select('*')
				.eq('thread_id', threadId)
				.order('created_at', { ascending: true })
				.limit(limit)

			if (error) {
				throw new Error(error.message)
			}

			return z.array(dbRowSchema).parse(data ?? [])
		},
	}
}
