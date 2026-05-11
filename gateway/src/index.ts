import { createClient } from '@supabase/supabase-js'
import { createApp } from './app'
import { createTelegramAdapter } from './adapters/telegram'
import { createWhatsappAdapter } from './adapters/whatsapp'
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

function optionalEnv(name: string): string | undefined {
	let value = process.env[name]
	return value && value.length > 0 ? value : undefined
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

let processMessage: ProcessMessage = async ({ inbound }) => {
	let caller = createMcpClient({
		baseUrl: MCP_BASE_URL,
		jwtSecret: SUPABASE_JWT_SECRET,
		userId: inbound.userId,
	})
	let tools = createMatchmakerTools(caller)
	return runAiCore({ inbound }, { store, tools })
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

let WHATSAPP_PHONE_NUMBER_ID = optionalEnv('WHATSAPP_PHONE_NUMBER_ID')
let WHATSAPP_ACCESS_TOKEN = optionalEnv('WHATSAPP_ACCESS_TOKEN')
let WHATSAPP_APP_SECRET = optionalEnv('WHATSAPP_APP_SECRET')
let WHATSAPP_VERIFY_TOKEN = optionalEnv('WHATSAPP_VERIFY_TOKEN')

if (
	WHATSAPP_PHONE_NUMBER_ID &&
	WHATSAPP_ACCESS_TOKEN &&
	WHATSAPP_APP_SECRET &&
	WHATSAPP_VERIFY_TOKEN
) {
	adapters.set(
		'whatsapp',
		createWhatsappAdapter({
			phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
			accessToken: WHATSAPP_ACCESS_TOKEN,
			appSecret: WHATSAPP_APP_SECRET,
			verifyToken: WHATSAPP_VERIFY_TOKEN,
			userMapping,
		}),
	)
}

let app = createApp({ adapters, service })

export default {
	port: Number(process.env.PORT) || 3001,
	fetch: app.fetch.bind(app),
}
