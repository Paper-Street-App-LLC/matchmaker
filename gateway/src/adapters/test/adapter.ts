import { z } from 'zod'
import type { ChatProviderAdapter } from '../types'
import type { InboundMessage, OutboundMessage } from '../../types/messages'

let testPayloadSchema = z.object({
	senderId: z.string().min(1),
	text: z.string().min(1),
})

export class TestAdapter implements ChatProviderAdapter {
	readonly provider = 'test'
	replies: OutboundMessage[] = []

	async parseInbound(raw: unknown): Promise<InboundMessage> {
		let payload = testPayloadSchema.parse(raw)
		return {
			provider: 'test',
			senderId: payload.senderId,
			text: payload.text,
			threadId: `test:${payload.senderId}`,
			timestamp: Date.now(),
		}
	}

	async sendReply(message: OutboundMessage): Promise<void> {
		this.replies.push(message)
	}

	async verifyWebhook(_request: Request): Promise<boolean> {
		return true
	}
}
