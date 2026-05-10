import { createClient } from '@supabase/supabase-js'
import { createApp } from './app'
import { createTelegramAdapter } from './adapters/telegram'
import { processMessage as runAiCore } from './core/ai'
import { createMcpClient } from './core/mcp-client'
import { createMatchmakerTools } from './core/tools'
import { createConversationStore, createSupabaseConversationDb } from './store/conversations'
import {
	HandleInboundMessage,
	type ProcessMessage,
} from './services/handle-inbound-message'
import { createUserMappingService } from './services/user-mapping'
import { createSupabaseUserMappingDb } from './store/user-provider-mappings'
import type { ChatAdapter } from './types/adapter'

function requireEnv(name: string): string {
	let value = process.env[name]
	if (!value) {
		throw new Error(`Missing required env var: ${name}`)
	}
	return value
}

let SUPABASE_URL = requireEnv('SUPABASE_URL')
let SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
let MCP_BASE_URL = requireEnv('MCP_BASE_URL')
let SUPABASE_JWT_SECRET = requireEnv('SUPABASE_JWT_SECRET')
let TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
let TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

let supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
let store = createConversationStore(createSupabaseConversationDb(supabase))
let userMapping = createUserMappingService({
	db: createSupabaseUserMappingDb(supabase),
})

let processMessage: ProcessMessage = async ({ inbound, systemPromptSuffix }) => {
	let caller = createMcpClient({
		baseUrl: MCP_BASE_URL,
		jwtSecret: SUPABASE_JWT_SECRET,
		userId: inbound.userId,
	})
	let tools = createMatchmakerTools(caller)
	return runAiCore({ inbound, systemPromptSuffix }, { store, tools })
}

let service = new HandleInboundMessage({ processMessage })
let adapters = new Map<string, ChatAdapter>()

if (TELEGRAM_BOT_TOKEN && TELEGRAM_WEBHOOK_SECRET) {
	adapters.set(
		'telegram',
		createTelegramAdapter({
			botToken: TELEGRAM_BOT_TOKEN,
			webhookSecret: TELEGRAM_WEBHOOK_SECRET,
			userMapping,
		}),
	)
} else {
	console.warn(
		'Telegram adapter not registered: set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET to enable it.',
	)
}

let app = createApp({ adapters, service })

export default {
	port: Number(process.env.PORT) || 3001,
	fetch: app.fetch.bind(app),
}
