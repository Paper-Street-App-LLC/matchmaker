import { Hono } from 'hono'
import type { ChatAdapter } from '../types/adapter'
import type { HandleInboundMessage } from '../services/handle-inbound-message'

export function createWebhookRouter(
	adapters: Map<string, ChatAdapter>,
	service: HandleInboundMessage,
) {
	let router = new Hono()

	router.post('/:provider', async (c) => {
		let provider = c.req.param('provider')
		let adapter = adapters.get(provider)
		if (!adapter) {
			return c.json({ error: 'Unknown provider' }, 404)
		}

		let verified = await adapter.verifyWebhook(c.req.raw)
		if (!verified) {
			return c.json({ error: 'Webhook verification failed' }, 401)
		}

		try {
			let body = await c.req.json()
			let message = await service.execute(adapter, body)
			return c.json({ ok: true, threadId: message.threadId })
		} catch {
			return c.json({ error: 'Bad request' }, 400)
		}
	})

	return router
}
