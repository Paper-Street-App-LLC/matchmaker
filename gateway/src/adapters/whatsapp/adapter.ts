import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { ChatAdapter, WebhookVerificationInput } from '../../types/adapter'
import type { OutboundMessage, RawInboundMessage } from '../../types/messages'
import type { UserMappingService } from '../../services/user-mapping'

let textMessageSchema = z.object({
	from: z.string().min(1),
	timestamp: z.string().min(1),
	type: z.literal('text'),
	text: z.object({ body: z.string().min(1) }),
})

let valueWithMessagesSchema = z.object({
	messages: z.array(z.unknown()).min(1),
})

let webhookEnvelopeSchema = z.object({
	entry: z
		.array(
			z.object({
				changes: z
					.array(
						z.object({
							value: z.unknown(),
						}),
					)
					.min(1),
			}),
		)
		.min(1),
})

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export type WhatsappAdapterOptions = {
	phoneNumberId: string
	accessToken: string
	appSecret: string
	verifyToken: string
	userMapping: UserMappingService
	fetch?: FetchLike
}

let GRAPH_API_BASE = 'https://graph.facebook.com/v20.0'
let SIGNATURE_HEADER = 'x-hub-signature-256'
let SIGNATURE_PREFIX = 'sha256='

export function createWhatsappAdapter(options: WhatsappAdapterOptions): ChatAdapter {
	let {
		phoneNumberId,
		accessToken,
		appSecret,
		verifyToken,
		userMapping,
		fetch: fetchImpl = fetch,
	} = options

	let messagesUrl = `${GRAPH_API_BASE}/${phoneNumberId}/messages`

	return {
		provider: 'whatsapp',

		async parseInbound(raw: unknown): Promise<RawInboundMessage> {
			let envelope = webhookEnvelopeSchema.parse(raw)
			let value = envelope.entry[0]!.changes[0]!.value
			let withMessages = valueWithMessagesSchema.parse(value)
			let message = textMessageSchema.parse(withMessages.messages[0])

			return {
				provider: 'whatsapp',
				senderId: message.from,
				text: message.text.body,
				threadId: message.from,
				timestamp: Number(message.timestamp) * 1000,
			}
		},

		async verifyWebhook(input: WebhookVerificationInput): Promise<boolean> {
			let header = input.headers.get(SIGNATURE_HEADER)
			if (!header || !header.startsWith(SIGNATURE_PREFIX)) return false

			let providedHex = header.slice(SIGNATURE_PREFIX.length)
			let expectedHex = createHmac('sha256', appSecret)
				.update(Buffer.from(input.body))
				.digest('hex')

			if (providedHex.length !== expectedHex.length) return false

			let provided = Buffer.from(providedHex, 'hex')
			let expected = Buffer.from(expectedHex, 'hex')
			if (provided.length !== expected.length) return false
			return timingSafeEqual(provided, expected)
		},

		async sendReply(message: OutboundMessage): Promise<void> {
			let res = await fetchImpl(messagesUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					messaging_product: 'whatsapp',
					to: message.senderId,
					type: 'text',
					text: { body: message.text },
				}),
			})

			if (!res.ok) {
				let text = await res.text().catch(() => '')
				throw new Error(
					`WhatsApp Graph API ${res.status} ${res.statusText}: ${text.slice(0, 500)}`,
				)
			}
		},

		async resolveUser(senderId: string): Promise<{ userId: string }> {
			let userId = await userMapping.resolveOrCreate('whatsapp', senderId)
			return { userId }
		},

		verifyChallenge(query: URLSearchParams): string | null {
			let mode = query.get('hub.mode')
			let token = query.get('hub.verify_token')
			let challenge = query.get('hub.challenge')
			if (mode !== 'subscribe') return null
			if (token !== verifyToken) return null
			if (challenge === null) return null
			return challenge
		},
	}
}
