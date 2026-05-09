import { Hono } from 'hono'
import { createWebhookRouter } from './router/webhook'
import type { ChatAdapter } from './types/adapter'
import type { HandleInboundMessage } from './services/handle-inbound-message'

export type AppDeps = {
	adapters: Map<string, ChatAdapter>
	service: HandleInboundMessage
}

export function createApp(deps: AppDeps) {
	let app = new Hono()

	app.get('/health', c => {
		return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
	})

	app.route('/webhook', createWebhookRouter(deps.adapters, deps.service))

	return app
}
