import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { buildContainer } from './container'
import { createSupabaseClient, createSupabaseAnonClient } from './lib/supabase'
import { createAuthMiddleware } from './middleware/auth'
import { createPeopleRoutes } from './routes/people'
import { createIntroductionsRoutes } from './routes/introductions'
import { createFeedbackRoutes } from './routes/feedback'
import { createMatchesRoutes } from './routes/matches'
import { createMatchDecisionsRoutes } from './routes/matchDecisions'
import { createOAuthRoutes } from './routes/oauth'
import { createLoginRoutes } from './routes/login'
import { createWellKnownRoutes } from './routes/well-known'
import { createRegisterRoutes } from './routes/register'
import { createMcpRoutes } from './routes/mcp'

let app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors())

// Public routes
app.get('/', c => {
	return c.json({ message: 'Matchmaker API', version: '0.1.0' })
})

app.get('/health', c => {
	return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Well-known routes (public, for OAuth discovery)
app.route('/.well-known', createWellKnownRoutes())

// Dynamic client registration (public, per RFC 7591)
app.route('/register', createRegisterRoutes())

// OAuth routes (public, no authentication required)
// Note: OAuth routes will be mounted with Supabase client below if available

// Login and OAuth routes (public, for OAuth authentication flow)
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
	let supabaseAnonClient = createSupabaseAnonClient({
		url: process.env.SUPABASE_URL,
		anonKey: process.env.SUPABASE_ANON_KEY,
	})
	app.route('/login', createLoginRoutes(supabaseAnonClient))
	app.route('/oauth', createOAuthRoutes(supabaseAnonClient))
} else {
	// Mount OAuth routes without Supabase client (refresh token will not work)
	app.route('/oauth', createOAuthRoutes())
}

// Initialize Supabase client and protected routes only if env vars are set
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
	let supabaseClient = createSupabaseClient({
		url: process.env.SUPABASE_URL,
		serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
	})
	let usecases = buildContainer(supabaseClient)

	// Protected API routes
	app.use('/api/*', createAuthMiddleware(supabaseClient))
	app.route('/api/people', createPeopleRoutes(usecases))
	app.route('/api/introductions', createIntroductionsRoutes(usecases))
	app.route('/api/feedback', createFeedbackRoutes(usecases))
	app.route('/api/matches', createMatchesRoutes(usecases))
	app.route('/api/match-decisions', createMatchDecisionsRoutes(usecases))

	// MCP Streamable HTTP endpoint (protected via route-level auth)
	app.route('/mcp', createMcpRoutes(supabaseClient, usecases))
}

// Export for Bun server
export default {
	port: Number(process.env.PORT) || 3000,
	fetch: app.fetch.bind(app),
}

export { app }
