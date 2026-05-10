import type { ChatAdapter } from '../types/adapter'
import type { InboundMessage, RawInboundMessage } from '../types/messages'
import { InboundParseError } from './errors'

export type ProcessMessage = (input: {
	inbound: InboundMessage
	systemPromptSuffix?: string
}) => Promise<string>

export type HandleInboundMessageOptions = {
	processMessage: ProcessMessage
}

export class HandleInboundMessage {
	private processMessage: ProcessMessage

	constructor(options: HandleInboundMessageOptions) {
		this.processMessage = options.processMessage
	}

	async execute(adapter: ChatAdapter, raw: unknown): Promise<InboundMessage> {
		let rawMessage: RawInboundMessage
		try {
			rawMessage = await adapter.parseInbound(raw)
		} catch (err) {
			throw new InboundParseError('Failed to parse inbound message', err)
		}

		let { userId } = await adapter.resolveUser(rawMessage.senderId)

		let message: InboundMessage = { ...rawMessage, userId }

		let replyText = await this.processMessage({
			inbound: message,
			systemPromptSuffix: adapter.systemPromptSuffix,
		})

		await adapter.sendReply({
			provider: message.provider,
			senderId: message.senderId,
			threadId: message.threadId,
			text: replyText,
		})

		return message
	}
}
