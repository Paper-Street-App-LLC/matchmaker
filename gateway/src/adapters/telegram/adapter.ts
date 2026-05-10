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

export const TELEGRAM_CHAT_STYLE_PROMPT = `## Response Style

You are speaking with the matchmaker over a real-time chat (Telegram). Write like you are texting a colleague, not writing a document.

- Keep replies short. Aim for 1–3 sentences per turn. Multi-paragraph replies are rarely appropriate.
- Ask one question at a time. Don't enumerate every phase you might cover.
- Use plain text only. Do not use markdown — no \`#\` headers, no \`**bold**\` or \`*italic*\`, no bullet points, no numbered lists, no fenced code blocks, no \`> blockquotes\`, no horizontal rules.
- If you must enumerate items, use natural prose ("first… then…") or simple line breaks.
- Avoid emojis unless the matchmaker uses them first.
- When presenting matches or summaries, keep each one to a single short paragraph and confirm interest before continuing.
- Don't echo back everything they said. Acknowledge briefly and move the conversation forward.
`

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

export function stripMarkdown(text: string): string {
	let out = text
	out = out.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, '$1')
	out = out.replace(/`([^`\n]+)`/g, '$1')
	out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '')
	out = out.replace(/\*\*([^\n*]+)\*\*/g, '$1')
	out = out.replace(/__([^\n_]+)__/g, '$1')
	out = out.replace(/(^|[^\w*])\*([^\n*]+)\*(?!\w)/g, '$1$2')
	out = out.replace(/(^|[^\w_])_([^\n_]+)_(?!\w)/g, '$1$2')
	out = out.replace(/~~([^~\n]+)~~/g, '$1')
	out = out.replace(/!\[([^\]\n]*)\]\([^)\n]*\)/g, '$1')
	out = out.replace(/\[([^\]\n]+)\]\([^)\n]+\)/g, '$1')
	out = out.replace(/^\s{0,3}>\s?/gm, '')
	out = out.replace(/^\s{0,3}[-*_]{3,}\s*$/gm, '')
	out = out.replace(/^(\s*)[-*+]\s+/gm, '$1')
	out = out.replace(/^(\s*)\d+\.\s+/gm, '$1')
	out = out.replace(/\n{3,}/g, '\n\n')
	return out.trim()
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
		systemPromptSuffix: TELEGRAM_CHAT_STYLE_PROMPT,

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
			let cleanText = stripMarkdown(message.text)
			let chunks = chunkText(cleanText, TELEGRAM_TEXT_LIMIT)
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
