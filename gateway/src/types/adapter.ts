import type { OutboundMessage, RawInboundMessage } from './messages'

/**
 * Inputs passed to verifyWebhook. The raw body is provided as a buffer
 * so adapters can compute signatures without consuming a Request stream
 * that the router still needs to parse.
 */
export interface WebhookVerificationInput {
	headers: Headers
	body: ArrayBuffer
}

export interface ChatAdapter {
	readonly provider: string
	readonly systemPromptSuffix?: string
	parseInbound(raw: unknown): Promise<RawInboundMessage>
	sendReply(message: OutboundMessage): Promise<void>
	resolveUser(senderId: string): Promise<{ userId: string }>
	verifyWebhook(input: WebhookVerificationInput): Promise<boolean>
}
