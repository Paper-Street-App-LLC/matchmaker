import type { SupabaseClient } from '@supabase/supabase-js'

export interface ConversationMessage {
	id: string
	thread_id: string
	role: 'user' | 'assistant'
	content: unknown
	provider?: string
	sender_id?: string
	created_at: string
}

export let save = async (
	supabaseClient: SupabaseClient,
	params: {
		threadId: string
		role: 'user' | 'assistant'
		content: unknown
		provider?: string
		senderId?: string
	}
): Promise<ConversationMessage> => {
	let { data, error } = await supabaseClient
		.from('conversations')
		.insert({
			thread_id: params.threadId,
			role: params.role,
			content: params.content,
			provider: params.provider,
			sender_id: params.senderId,
		})
		.select()
		.single()

	if (error || !data) {
		throw new Error(`Failed to save conversation message: ${error?.message ?? 'unknown error'}`)
	}

	return data as ConversationMessage
}

export let getHistory = async (
	supabaseClient: SupabaseClient,
	threadId: string,
	limit: number
): Promise<ConversationMessage[]> => {
	let { data, error } = await supabaseClient
		.from('conversations')
		.select('*')
		.eq('thread_id', threadId)
		.order('created_at', { ascending: true })
		.limit(limit)

	if (error) {
		throw new Error(`Failed to get conversation history: ${error.message}`)
	}

	return (data ?? []) as ConversationMessage[]
}
