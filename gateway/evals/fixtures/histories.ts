import type { ConversationMessage } from '../../src/store/conversations'

export function emptyHistory(): ConversationMessage[] {
	return []
}

export function historyWithName(threadId: string, name: string): ConversationMessage[] {
	return [
		{
			id: '1',
			threadId,
			role: 'user',
			content: `My name is ${name}`,
			createdAt: '2026-04-01T00:00:00Z',
		},
		{
			id: '2',
			threadId,
			role: 'assistant',
			content: `Nice to meet you, ${name}.`,
			createdAt: '2026-04-01T00:00:01Z',
		},
	]
}

export function makeStaticStore(history: ConversationMessage[]) {
	let saved: { threadId: string; role: string; content: string }[] = []
	return {
		async getHistory() {
			return history
		},
		async save(message: { threadId: string; role: string; content: string }) {
			saved.push(message)
		},
		saved,
	}
}
