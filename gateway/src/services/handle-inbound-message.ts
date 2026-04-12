import type { ChatAdapter } from '../types/adapter'
import type { InboundMessage, RawInboundMessage } from '../types/messages'
import { InboundParseError } from './errors'

export class HandleInboundMessage {
	async execute(adapter: ChatAdapter, raw: unknown): Promise<InboundMessage> {
		let rawMessage: RawInboundMessage
		try {
			rawMessage = await adapter.parseInbound(raw)
		} catch (err) {
			throw new InboundParseError('Failed to parse inbound message', err)
		}

		let { userId } = await adapter.resolveUser(rawMessage.senderId)

		let message: InboundMessage = { ...rawMessage, userId }

		await adapter.sendReply({
			provider: message.provider,
			senderId: message.senderId,
			threadId: message.threadId,
			text: `Message received from ${userId}`,
		})

		return message
	}
}
