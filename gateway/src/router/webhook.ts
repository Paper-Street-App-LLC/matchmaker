import { Hono } from 'hono'
import type { ChatAdapter } from '../types/adapter'
import type { HandleInboundMessage } from '../services/handle-inbound-message'
import { InboundParseError } from '../services/errors'

export function createWebhookRouter(
	adapters: Map<string, ChatAdapter>,
	service: HandleInboundMessage,
) {
	let router = new Hono()

	router.get('/:provider', (c) => {
		let provider = c.req.param('provider')
		let adapter = adapters.get(provider)
		if (!adapter || !adapter.verifyChallenge) {
			return c.json({ error: 'Not found' }, 404)
		}

		let url = new URL(c.req.url)
		let challenge = adapter.verifyChallenge(url.searchParams)
		if (challenge === null) {
			return c.json({ error: 'Forbidden' }, 403)
		}

		return c.text(challenge, 200)
	})

	router.post('/:provider', async (c) => {
		let provider = c.req.param('provider')
		let adapter = adapters.get(provider)
		if (!adapter) {
			return c.json({ error: 'Unknown provider' }, 404)
		}

		let body = await c.req.arrayBuffer()

		let verified = await adapter.verifyWebhook({
			headers: c.req.raw.headers,
			body,
		})
		if (!verified) {
			return c.json({ error: 'Webhook verification failed' }, 401)
		}

		let parsed: unknown
		try {
			parsed = JSON.parse(new TextDecoder().decode(body))
		} catch {
			return c.json({ error: 'Invalid JSON' }, 400)
		}

		try {
			let message = await service.execute(adapter, parsed)
			return c.json({ ok: true, threadId: message.threadId })
		} catch (err) {
			if (err instanceof InboundParseError) {
				return c.json({ error: 'Bad request' }, 400)
			}
			throw err
		}
	})

	return router
}
