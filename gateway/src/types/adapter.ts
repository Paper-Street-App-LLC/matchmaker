import type { InboundMessage, OutboundMessage } from './messages'

export interface ChatAdapter {
	readonly provider: string
	parseInbound(raw: unknown): Promise<InboundMessage>
	sendReply(message: OutboundMessage): Promise<void>
	resolveUser(senderId: string): Promise<{ userId: string }>
	verifyWebhook(request: Request): Promise<boolean>
}
