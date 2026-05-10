import { describe, test, expect } from 'bun:test'
import { createHmac } from 'node:crypto'
import { createWhatsappAdapter } from '../../../src/adapters/whatsapp'
import type { UserMappingService } from '../../../src/services/user-mapping'

let PHONE_NUMBER_ID = '111222333'
let ACCESS_TOKEN = 'test-access-token'
let APP_SECRET = 'test-app-secret'
let VERIFY_TOKEN = 'test-verify-token'
let RESOLVED_USER_ID = '550e8400-e29b-41d4-a716-446655440000'

function makeUserMapping(overrides: Partial<UserMappingService> = {}): UserMappingService {
	return {
		resolveOrCreate: async () => RESOLVED_USER_ID,
		...overrides,
	}
}

function buildAdapter(overrides: {
	userMapping?: UserMappingService
	fetch?: typeof fetch
} = {}) {
	return createWhatsappAdapter({
		phoneNumberId: PHONE_NUMBER_ID,
		accessToken: ACCESS_TOKEN,
		appSecret: APP_SECRET,
		verifyToken: VERIFY_TOKEN,
		userMapping: overrides.userMapping ?? makeUserMapping(),
		fetch: overrides.fetch,
	})
}

function metaTextWebhook(opts: {
	from?: string
	body?: string
	timestamp?: string
} = {}) {
	return {
		object: 'whatsapp_business_account',
		entry: [
			{
				id: 'WABA_ID',
				changes: [
					{
						field: 'messages',
						value: {
							messaging_product: 'whatsapp',
							metadata: {
								display_phone_number: '15555550000',
								phone_number_id: PHONE_NUMBER_ID,
							},
							messages: [
								{
									from: opts.from ?? '15551234567',
									id: 'wamid.ABC',
									timestamp: opts.timestamp ?? '1715000000',
									type: 'text',
									text: { body: opts.body ?? 'hello there' },
								},
							],
						},
					},
				],
			},
		],
	}
}

function metaStatusOnlyWebhook() {
	return {
		object: 'whatsapp_business_account',
		entry: [
			{
				id: 'WABA_ID',
				changes: [
					{
						field: 'messages',
						value: {
							messaging_product: 'whatsapp',
							metadata: {
								display_phone_number: '15555550000',
								phone_number_id: PHONE_NUMBER_ID,
							},
							statuses: [
								{
									id: 'wamid.ABC',
									status: 'delivered',
									timestamp: '1715000000',
									recipient_id: '15551234567',
								},
							],
						},
					},
				],
			},
		],
	}
}

describe('createWhatsappAdapter', () => {
	test('exposes provider "whatsapp"', () => {
		let adapter = buildAdapter()
		expect(adapter.provider).toBe('whatsapp')
	})

	describe('parseInbound', () => {
		test('parses a valid Meta text webhook into a RawInboundMessage', async () => {
			let adapter = buildAdapter()
			let raw = metaTextWebhook({ from: '15551234567', body: 'hello there', timestamp: '1715000000' })

			let parsed = await adapter.parseInbound(raw)

			expect(parsed.provider).toBe('whatsapp')
			expect(parsed.senderId).toBe('15551234567')
			expect(parsed.text).toBe('hello there')
			expect(parsed.threadId).toBe('15551234567')
			expect(parsed.timestamp).toBe(1715000000 * 1000)
		})

		test('throws on a status-only payload (no messages array)', async () => {
			let adapter = buildAdapter()
			await expect(adapter.parseInbound(metaStatusOnlyWebhook())).rejects.toThrow()
		})

		test('throws on a payload that is not a Meta webhook envelope', async () => {
			let adapter = buildAdapter()
			await expect(adapter.parseInbound({ random: 'thing' })).rejects.toThrow()
		})

		test('throws on a non-text message type', async () => {
			let adapter = buildAdapter()
			let raw = {
				object: 'whatsapp_business_account',
				entry: [
					{
						id: 'WABA_ID',
						changes: [
							{
								field: 'messages',
								value: {
									messaging_product: 'whatsapp',
									metadata: { display_phone_number: '15555550000', phone_number_id: PHONE_NUMBER_ID },
									messages: [
										{
											from: '15551234567',
											id: 'wamid.IMG',
											timestamp: '1715000000',
											type: 'image',
											image: { mime_type: 'image/jpeg', sha256: 'x', id: 'media-id' },
										},
									],
								},
							},
						],
					},
				],
			}
			await expect(adapter.parseInbound(raw)).rejects.toThrow()
		})
	})

	describe('verifyWebhook', () => {
		function signedRequest(bodyText: string, secret = APP_SECRET) {
			let body = new TextEncoder().encode(bodyText).buffer as ArrayBuffer
			let hex = createHmac('sha256', secret).update(bodyText).digest('hex')
			let headers = new Headers({ 'X-Hub-Signature-256': `sha256=${hex}` })
			return { body, headers }
		}

		test('returns true for a correct signature', async () => {
			let adapter = buildAdapter()
			let payload = JSON.stringify(metaTextWebhook())
			let { body, headers } = signedRequest(payload)

			let ok = await adapter.verifyWebhook({ headers, body })
			expect(ok).toBe(true)
		})

		test('returns false when signature is tampered', async () => {
			let adapter = buildAdapter()
			let payload = JSON.stringify(metaTextWebhook())
			let { body } = signedRequest(payload)
			let tampered = new Headers({ 'X-Hub-Signature-256': 'sha256=' + 'a'.repeat(64) })

			let ok = await adapter.verifyWebhook({ headers: tampered, body })
			expect(ok).toBe(false)
		})

		test('returns false when signature header is missing', async () => {
			let adapter = buildAdapter()
			let payload = JSON.stringify(metaTextWebhook())
			let body = new TextEncoder().encode(payload).buffer as ArrayBuffer

			let ok = await adapter.verifyWebhook({ headers: new Headers(), body })
			expect(ok).toBe(false)
		})

		test('returns false when signature is wrong length', async () => {
			let adapter = buildAdapter()
			let payload = JSON.stringify(metaTextWebhook())
			let body = new TextEncoder().encode(payload).buffer as ArrayBuffer
			let headers = new Headers({ 'X-Hub-Signature-256': 'sha256=deadbeef' })

			let ok = await adapter.verifyWebhook({ headers, body })
			expect(ok).toBe(false)
		})

		test('returns false when signature header lacks the sha256= prefix', async () => {
			let adapter = buildAdapter()
			let payload = JSON.stringify(metaTextWebhook())
			let bodyText = payload
			let hex = createHmac('sha256', APP_SECRET).update(bodyText).digest('hex')
			let body = new TextEncoder().encode(bodyText).buffer as ArrayBuffer
			let headers = new Headers({ 'X-Hub-Signature-256': hex })

			let ok = await adapter.verifyWebhook({ headers, body })
			expect(ok).toBe(false)
		})
	})

	describe('sendReply', () => {
		test('POSTs to the Meta Graph API with bearer auth and the right body', async () => {
			let captured: { url: string; init: RequestInit } | null = null
			let fakeFetch: typeof fetch = async (input, init) => {
				captured = { url: String(input), init: init ?? {} }
				return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
			}
			let adapter = buildAdapter({ fetch: fakeFetch })

			await adapter.sendReply({
				provider: 'whatsapp',
				senderId: '15551234567',
				threadId: '15551234567',
				text: 'hello back',
			})

			expect(captured).not.toBeNull()
			expect(captured!.url).toBe(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`)
			expect(captured!.init.method).toBe('POST')
			let headers = new Headers(captured!.init.headers as HeadersInit)
			expect(headers.get('authorization')).toBe(`Bearer ${ACCESS_TOKEN}`)
			expect(headers.get('content-type')).toBe('application/json')
			let body = JSON.parse(String(captured!.init.body))
			expect(body).toEqual({
				messaging_product: 'whatsapp',
				to: '15551234567',
				type: 'text',
				text: { body: 'hello back' },
			})
		})

		test('throws on non-2xx response', async () => {
			let fakeFetch: typeof fetch = async () =>
				new Response('{"error":{"message":"bad"}}', { status: 400 })
			let adapter = buildAdapter({ fetch: fakeFetch })

			await expect(
				adapter.sendReply({
					provider: 'whatsapp',
					senderId: '15551234567',
					threadId: '15551234567',
					text: 'oops',
				}),
			).rejects.toThrow()
		})
	})

	describe('resolveUser', () => {
		test('delegates to UserMappingService.resolveOrCreate("whatsapp", senderId)', async () => {
			let calls: Array<[string, string]> = []
			let userMapping = makeUserMapping({
				resolveOrCreate: async (provider, senderId) => {
					calls.push([provider, senderId])
					return RESOLVED_USER_ID
				},
			})
			let adapter = buildAdapter({ userMapping })

			let result = await adapter.resolveUser('15551234567')

			expect(result).toEqual({ userId: RESOLVED_USER_ID })
			expect(calls).toEqual([['whatsapp', '15551234567']])
		})
	})

	describe('verifyChallenge', () => {
		test('returns the challenge value when mode=subscribe and token matches', () => {
			let adapter = buildAdapter()
			let q = new URLSearchParams({
				'hub.mode': 'subscribe',
				'hub.verify_token': VERIFY_TOKEN,
				'hub.challenge': '12345',
			})

			expect(adapter.verifyChallenge!(q)).toBe('12345')
		})

		test('returns null when token mismatches', () => {
			let adapter = buildAdapter()
			let q = new URLSearchParams({
				'hub.mode': 'subscribe',
				'hub.verify_token': 'wrong',
				'hub.challenge': '12345',
			})

			expect(adapter.verifyChallenge!(q)).toBeNull()
		})

		test('returns null when mode is missing', () => {
			let adapter = buildAdapter()
			let q = new URLSearchParams({
				'hub.verify_token': VERIFY_TOKEN,
				'hub.challenge': '12345',
			})

			expect(adapter.verifyChallenge!(q)).toBeNull()
		})

		test('returns null when challenge is missing', () => {
			let adapter = buildAdapter()
			let q = new URLSearchParams({
				'hub.mode': 'subscribe',
				'hub.verify_token': VERIFY_TOKEN,
			})

			expect(adapter.verifyChallenge!(q)).toBeNull()
		})
	})
})
