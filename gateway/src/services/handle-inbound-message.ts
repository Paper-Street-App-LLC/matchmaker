import type { ChatAdapter } from '../types/adapter'
import type { InboundMessage } from '../types/messages'

export class HandleInboundMessage {
	async execute(adapter: ChatAdapter, raw: unknown): Promise<InboundMessage> {
		let message = await adapter.parseInbound(raw)
		let { userId } = await adapter.resolveUser(message.senderId)

		await adapter.sendReply({
			provider: message.provider,
			senderId: message.senderId,
			threadId: message.threadId,
			text: `Message received from ${userId}`,
		})

		return message
	}
}
