import type { InboundMessage, OutboundMessage } from '../types/messages'

export interface ChatProviderAdapter {
	readonly provider: string
	parseInbound(raw: unknown): Promise<InboundMessage>
	sendReply(message: OutboundMessage): Promise<void>
	verifyWebhook(request: Request): Promise<boolean>
}
