import type { InboundMessage } from '../../src/types/messages'

let DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

export function makeInbound(overrides: Partial<InboundMessage> = {}): InboundMessage {
	return {
		provider: 'telegram',
		senderId: 'eval-sender',
		threadId: `eval-thread-${Math.random().toString(36).slice(2, 10)}`,
		timestamp: Date.now(),
		text: 'hello',
		userId: DEFAULT_USER_ID,
		...overrides,
	}
}
