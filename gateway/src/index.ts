import { createClient } from '@supabase/supabase-js'
import { createApp } from './app'
import { processMessage as runAiCore } from './core/ai'
import { createMcpClient } from './core/mcp-client'
import { createMatchmakerTools } from './core/tools'
import { createConversationStore, type ConversationStoreClient } from './store/conversations'
import {
	HandleInboundMessage,
	type ProcessMessage,
} from './services/handle-inbound-message'
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

let supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
let store = createConversationStore(supabase as unknown as ConversationStoreClient)

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

let app = createApp({ adapters, service })

export default {
	port: Number(process.env.PORT) || 3001,
	fetch: app.fetch.bind(app),
}

export { app }
