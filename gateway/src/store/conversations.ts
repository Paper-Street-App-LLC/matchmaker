import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

export type ConversationMessage = {
	id?: string
	threadId: string
	role: 'user' | 'assistant' | 'system'
	content: string
	provider?: string
	senderId?: string
	createdAt?: string
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

function toMessage(row: z.infer<typeof dbRowSchema>): ConversationMessage {
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

export function createConversationStore(client: SupabaseClient) {
	return {
		async save(message: Omit<ConversationMessage, 'id' | 'createdAt'>) {
			let { error } = await client.from('conversations').insert({
				thread_id: message.threadId,
				role: message.role,
				content: message.content,
				provider: message.provider ?? null,
				sender_id: message.senderId ?? null,
			})

			if (error) {
				throw new Error(error.message)
			}
		},

		async getHistory(threadId: string, limit: number): Promise<ConversationMessage[]> {
			let { data, error } = await client
				.from('conversations')
				.select('*')
				.eq('thread_id', threadId)
				.order('created_at', { ascending: true })
				.limit(limit)

			if (error) {
				throw new Error(error.message)
			}

			if (!data) {
				return []
			}

			let rows = z.array(dbRowSchema).parse(data)
			return rows.map(toMessage)
		},
	}
}
