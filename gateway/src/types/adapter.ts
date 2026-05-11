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
	parseInbound(raw: unknown): Promise<RawInboundMessage>
	sendReply(message: OutboundMessage): Promise<void>
	resolveUser(senderId: string): Promise<{ userId: string }>
	verifyWebhook(input: WebhookVerificationInput): Promise<boolean>
	/**
	 * Optional one-time verification handshake for providers that issue a
	 * GET challenge during webhook subscription (e.g. Meta Cloud API).
	 * Return the challenge value to echo back, or null to reject. Adapters
	 * that have no GET handshake should leave this undefined; the router
	 * responds with 404 in that case.
	 */
	verifyChallenge?(query: URLSearchParams): string | null
}
