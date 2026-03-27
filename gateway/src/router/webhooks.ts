import { Hono } from 'hono'
import type { SupabaseClient } from '@supabase/supabase-js'
import * as registry from './registry'
import { resolveOrCreate as defaultResolveOrCreate } from '../services/user-mapping'
import { processMessage, type Deps as AiDeps } from '../core/ai'

type ResolveOrCreateFn = (
	supabaseClient: SupabaseClient,
	provider: string,
	senderId: string
) => Promise<string>

type WebhookDeps = {
	supabaseClient: SupabaseClient
	aiDeps?: AiDeps
	resolveOrCreate?: ResolveOrCreateFn
}

export let createWebhookRoutes = (deps: WebhookDeps) => {
	let app = new Hono()

	app.post('/:provider', async c => {
		let provider = c.req.param('provider')
		let adapter = registry.get(provider)

		if (!adapter) {
			return c.json({ error: `Unknown provider: ${provider}` }, 404)
		}

		// Verify webhook signature
		let isValid = await adapter.verifyWebhook(c.req.raw)
		if (!isValid) {
			return c.json({ error: 'Invalid webhook signature' }, 401)
		}

		// Parse inbound message
		let body = await c.req.json()
		let inbound
		try {
			inbound = await adapter.parseInbound(body)
		} catch {
			return c.json({ error: 'Failed to parse inbound message' }, 400)
		}

		// Resolve user
		let resolveOrCreate = deps.resolveOrCreate ?? defaultResolveOrCreate
		let userId = await resolveOrCreate(deps.supabaseClient, inbound.provider, inbound.senderId)

		// Process through AI core
		let responseText = await processMessage({
			text: inbound.text,
			threadId: inbound.threadId,
			userId,
			supabaseClient: deps.supabaseClient,
			deps: deps.aiDeps,
		})

		// Send reply
		await adapter.sendReply({
			provider: inbound.provider,
			senderId: inbound.senderId,
			threadId: inbound.threadId,
			text: responseText,
		})

		return c.json({ ok: true })
	})

	return app
}
