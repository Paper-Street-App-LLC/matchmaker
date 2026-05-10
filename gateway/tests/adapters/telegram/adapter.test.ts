import { describe, test, expect } from 'bun:test'
import { createTelegramAdapter } from '../../../src/adapters/telegram'
import type { UserMappingService } from '../../../src/services/user-mapping'

const BOT_TOKEN = 'test-bot-token'
const WEBHOOK_SECRET = 'super-secret-token'
const USER_ID = '550e8400-e29b-41d4-a716-446655440000'

function makeUserMapping(
	resolve: (provider: string, senderId: string) => Promise<string> = async () => USER_ID,
): UserMappingService & { calls: Array<{ provider: string; senderId: string }> } {
	let calls: Array<{ provider: string; senderId: string }> = []
	return {
		calls,
		async resolveOrCreate(provider, senderId) {
			calls.push({ provider, senderId })
			return resolve(provider, senderId)
		},
	}
}

type FetchCall = { url: string; init: RequestInit | undefined }

function makeRecordingFetch(
	respond: (call: FetchCall) => Response = () => new Response('{"ok":true}', { status: 200 }),
): { fetch: typeof fetch; calls: FetchCall[] } {
	let calls: FetchCall[] = []
	let fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
		let url =
			typeof input === 'string'
				? input
				: input instanceof URL
					? input.toString()
					: input.url
		let call: FetchCall = { url, init }
		calls.push(call)
		return respond(call)
	}) as unknown as typeof fetch
	return { fetch: fakeFetch, calls }
}

function buildAdapter(opts: {
	userMapping?: UserMappingService
	fetch?: typeof fetch
} = {}) {
	return createTelegramAdapter({
		botToken: BOT_TOKEN,
		webhookSecret: WEBHOOK_SECRET,
		userMapping: opts.userMapping ?? makeUserMapping(),
		fetch: opts.fetch,
	})
}

function validUpdate(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		update_id: 1,
		message: {
			message_id: 10,
			from: { id: 123, is_bot: false, first_name: 'Alice' },
			chat: { id: 456, type: 'private', first_name: 'Alice' },
			date: 1_700_000_000,
			text: 'Hello',
			...overrides,
		},
	}
}

describe('createTelegramAdapter', () => {
	test('exposes provider="telegram"', () => {
		let adapter = buildAdapter()
		expect(adapter.provider).toBe('telegram')
	})

	describe('parseInbound', () => {
		test('parses a valid text Telegram update into a RawInboundMessage', async () => {
			let adapter = buildAdapter()

			let parsed = await adapter.parseInbound(validUpdate())

			expect(parsed).toEqual({
				provider: 'telegram',
				senderId: '123',
				text: 'Hello',
				threadId: '456',
				timestamp: 1_700_000_000_000,
			})
		})

		test('rejects callback_query updates', async () => {
			let adapter = buildAdapter()
			let raw = {
				update_id: 2,
				callback_query: {
					id: 'cb-1',
					from: { id: 123, is_bot: false, first_name: 'Alice' },
					chat_instance: 'inst-1',
					data: 'noop',
				},
			}

			await expect(adapter.parseInbound(raw)).rejects.toThrow()
		})

		test('rejects edited_message updates', async () => {
			let adapter = buildAdapter()
			let raw = {
				update_id: 3,
				edited_message: {
					message_id: 10,
					from: { id: 123, is_bot: false, first_name: 'Alice' },
					chat: { id: 456, type: 'private', first_name: 'Alice' },
					date: 1_700_000_000,
					edit_date: 1_700_000_010,
					text: 'edited',
				},
			}

			await expect(adapter.parseInbound(raw)).rejects.toThrow()
		})

		test('rejects non-text messages (e.g. status/photo only)', async () => {
			let adapter = buildAdapter()
			let raw = validUpdate({ text: undefined, photo: [{ file_id: 'abc', file_unique_id: 'u', width: 1, height: 1 }] })

			await expect(adapter.parseInbound(raw)).rejects.toThrow()
		})

		test('rejects malformed payloads', async () => {
			let adapter = buildAdapter()

			await expect(adapter.parseInbound({ totally: 'bogus' })).rejects.toThrow()
			await expect(adapter.parseInbound(null)).rejects.toThrow()
		})
	})

	describe('verifyWebhook', () => {
		test('returns true when X-Telegram-Bot-Api-Secret-Token matches', async () => {
			let adapter = buildAdapter()
			let headers = new Headers({ 'X-Telegram-Bot-Api-Secret-Token': WEBHOOK_SECRET })

			let ok = await adapter.verifyWebhook({ headers, body: new ArrayBuffer(0) })

			expect(ok).toBe(true)
		})

		test('returns false when the header is wrong', async () => {
			let adapter = buildAdapter()
			let headers = new Headers({ 'X-Telegram-Bot-Api-Secret-Token': 'nope' })

			let ok = await adapter.verifyWebhook({ headers, body: new ArrayBuffer(0) })

			expect(ok).toBe(false)
		})

		test('returns false when the header is missing', async () => {
			let adapter = buildAdapter()

			let ok = await adapter.verifyWebhook({ headers: new Headers(), body: new ArrayBuffer(0) })

			expect(ok).toBe(false)
		})

		test('returns false when the header has the right prefix but a longer suffix', async () => {
			let adapter = buildAdapter()
			let headers = new Headers({
				'X-Telegram-Bot-Api-Secret-Token': WEBHOOK_SECRET + 'x',
			})

			let ok = await adapter.verifyWebhook({ headers, body: new ArrayBuffer(0) })

			expect(ok).toBe(false)
		})
	})

	describe('sendReply', () => {
		test('POSTs to the Telegram Bot API sendMessage endpoint with chat_id and text', async () => {
			let { fetch: fakeFetch, calls } = makeRecordingFetch()
			let adapter = buildAdapter({ fetch: fakeFetch })

			await adapter.sendReply({
				provider: 'telegram',
				senderId: '123',
				threadId: '456',
				text: 'Hi there',
			})

			expect(calls).toHaveLength(1)
			expect(calls[0]!.url).toBe(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`)
			expect(calls[0]!.init?.method).toBe('POST')
			let headers = new Headers(calls[0]!.init?.headers)
			expect(headers.get('content-type')).toBe('application/json')
			let body = JSON.parse(calls[0]!.init!.body as string) as { chat_id: number; text: string }
			expect(body.chat_id).toBe(456)
			expect(body.text).toBe('Hi there')
		})

		test('chunks text longer than 4096 characters into ordered messages', async () => {
			let { fetch: fakeFetch, calls } = makeRecordingFetch()
			let adapter = buildAdapter({ fetch: fakeFetch })

			let chunkA = 'a'.repeat(4096)
			let chunkB = 'b'.repeat(4096)
			let chunkC = 'c'.repeat(100)
			let text = chunkA + chunkB + chunkC

			await adapter.sendReply({
				provider: 'telegram',
				senderId: '123',
				threadId: '456',
				text,
			})

			expect(calls).toHaveLength(3)
			let bodies = calls.map(c => JSON.parse(c.init!.body as string) as { text: string })
			expect(bodies[0]!.text).toBe(chunkA)
			expect(bodies[1]!.text).toBe(chunkB)
			expect(bodies[2]!.text).toBe(chunkC)
		})

		test('throws on a non-2xx response', async () => {
			let { fetch: fakeFetch } = makeRecordingFetch(
				() => new Response('{"ok":false,"description":"bad"}', { status: 400 }),
			)
			let adapter = buildAdapter({ fetch: fakeFetch })

			await expect(
				adapter.sendReply({
					provider: 'telegram',
					senderId: '123',
					threadId: '456',
					text: 'Hi',
				}),
			).rejects.toThrow()
		})

		test('sends chunks sequentially (not in parallel)', async () => {
			let inflight = 0
			let maxInflight = 0
			let fakeFetch = (async () => {
				inflight++
				maxInflight = Math.max(maxInflight, inflight)
				await new Promise(resolve => setTimeout(resolve, 5))
				inflight--
				return new Response('{"ok":true}', { status: 200 })
			}) as unknown as typeof fetch
			let adapter = buildAdapter({ fetch: fakeFetch })

			await adapter.sendReply({
				provider: 'telegram',
				senderId: '123',
				threadId: '456',
				text: 'a'.repeat(4096) + 'b'.repeat(4096),
			})

			expect(maxInflight).toBe(1)
		})
	})

	describe('resolveUser', () => {
		test('first-time call delegates to UserMappingService.resolveOrCreate and returns the uuid', async () => {
			let userMapping = makeUserMapping()
			let adapter = buildAdapter({ userMapping })

			let result = await adapter.resolveUser('123')

			expect(result).toEqual({ userId: USER_ID })
			expect(userMapping.calls).toEqual([{ provider: 'telegram', senderId: '123' }])
		})

		test('returning user goes through the same delegation with provider="telegram"', async () => {
			let existingId = 'existing-uuid-1234'
			let userMapping = makeUserMapping(async () => existingId)
			let adapter = buildAdapter({ userMapping })

			let result = await adapter.resolveUser('99999')

			expect(result).toEqual({ userId: existingId })
			expect(userMapping.calls).toEqual([{ provider: 'telegram', senderId: '99999' }])
		})
	})
})
