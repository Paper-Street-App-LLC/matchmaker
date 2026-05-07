import { describe, test, expect } from 'bun:test'
import { z } from 'zod'
import { createApp } from '../src/app'
import { HandleInboundMessage } from '../src/services/handle-inbound-message'
import type { ChatAdapter } from '../src/types/adapter'

let healthSchema = z.object({
	status: z.string(),
	timestamp: z.string(),
})

function buildEmptyApp() {
	let adapters = new Map<string, ChatAdapter>()
	let service = new HandleInboundMessage({ processMessage: async () => 'ack' })
	return createApp({ adapters, service })
}

describe('Gateway', () => {
	describe('Public Routes', () => {
		test('GET /health returns 200 with healthy status', async () => {
			let app = buildEmptyApp()
			let res = await app.fetch(new Request('http://localhost/health'))

			expect(res.status).toBe(200)

			let json = (await res.json()) as { status: string; timestamp: string }
			let data = healthSchema.parse(json)

			expect(data.status).toBe('healthy')
			expect(data.timestamp).toBeDefined()
		})

		test('GET /nonexistent returns 404', async () => {
			let app = buildEmptyApp()
			let res = await app.fetch(new Request('http://localhost/nonexistent'))

			expect(res.status).toBe(404)
		})
	})
})
