import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { ChatAdapter, WebhookVerificationInput } from '../../types/adapter'
import type { OutboundMessage, RawInboundMessage } from '../../types/messages'
import type { UserMappingService } from '../../services/user-mapping'

export type TelegramAdapterOptions = {
	botToken: string
	webhookSecret: string
	userMapping: UserMappingService
	fetch?: typeof fetch
}

const PROVIDER = 'telegram'
const TELEGRAM_TEXT_LIMIT = 4096
const SECRET_HEADER = 'x-telegram-bot-api-secret-token'
const API_BASE = 'https://api.telegram.org'

export class TelegramParseError extends Error {
	constructor(message: string, public readonly cause?: unknown) {
		super(message)
		this.name = 'TelegramParseError'
	}
}

let textMessageSchema = z.object({
	message_id: z.number(),
	from: z.object({ id: z.number() }),
	chat: z.object({ id: z.number() }),
	date: z.number().int().nonnegative(),
	text: z.string().min(1),
})

let textUpdateSchema = z
	.object({
		update_id: z.number(),
		message: textMessageSchema,
	})
	.passthrough()

function chunkText(text: string, limit: number): string[] {
	if (text.length <= limit) return [text]
	let chunks: string[] = []
	for (let i = 0; i < text.length; i += limit) {
		chunks.push(text.slice(i, i + limit))
	}
	return chunks
}

function constantTimeEquals(a: string, b: string): boolean {
	let aBuf = Buffer.from(a, 'utf8')
	let bBuf = Buffer.from(b, 'utf8')
	if (aBuf.length !== bBuf.length) return false
	return timingSafeEqual(aBuf, bBuf)
}

export function createTelegramAdapter(options: TelegramAdapterOptions): ChatAdapter {
	let { botToken, webhookSecret, userMapping } = options
	let fetchImpl = options.fetch ?? fetch
	let sendMessageUrl = `${API_BASE}/bot${botToken}/sendMessage`

	return {
		provider: PROVIDER,

		async parseInbound(raw: unknown): Promise<RawInboundMessage> {
			let result = textUpdateSchema.safeParse(raw)
			if (!result.success) {
				throw new TelegramParseError(
					'Telegram update is not a supported text message',
					result.error,
				)
			}
			let { message } = result.data
			return {
				provider: PROVIDER,
				senderId: String(message.from.id),
				text: message.text,
				threadId: String(message.chat.id),
				timestamp: message.date * 1000,
			}
		},

		async verifyWebhook({ headers }: WebhookVerificationInput): Promise<boolean> {
			let provided = headers.get(SECRET_HEADER)
			if (provided === null) return false
			return constantTimeEquals(provided, webhookSecret)
		},

		async sendReply(message: OutboundMessage): Promise<void> {
			let chatId = Number(message.threadId)
			let chunks = chunkText(message.text, TELEGRAM_TEXT_LIMIT)
			for (let chunk of chunks) {
				let response = await fetchImpl(sendMessageUrl, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ chat_id: chatId, text: chunk }),
				})
				if (!response.ok) {
					let detail = await response.text().catch(() => '')
					throw new Error(
						`Telegram sendMessage failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`,
					)
				}
			}
		},

		async resolveUser(senderId: string): Promise<{ userId: string }> {
			let userId = await userMapping.resolveOrCreate(PROVIDER, senderId)
			return { userId }
		},
	}
}
