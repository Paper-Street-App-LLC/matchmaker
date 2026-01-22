import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { createSupabaseClient, createSupabaseAnonClient } from './lib/supabase'
import { createAuthMiddleware } from './middleware/auth'
import { createPeopleRoutes } from './routes/people'
import { createIntroductionsRoutes } from './routes/introductions'
import { createFeedbackRoutes } from './routes/feedback'
import { createMatchesRoutes } from './routes/matches'
import { createOAuthRoutes } from './routes/oauth'
import { createLoginRoutes } from './routes/login'

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

// OAuth routes (public, no authentication required)
app.route('/oauth', createOAuthRoutes())

// Login routes (public, for OAuth authentication flow)
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
	let supabaseAnonClient = createSupabaseAnonClient({
		url: process.env.SUPABASE_URL,
		anonKey: process.env.SUPABASE_ANON_KEY,
	})
	app.route('/login', createLoginRoutes(supabaseAnonClient))
}

// Initialize Supabase client and protected routes only if env vars are set
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
	let supabaseClient = createSupabaseClient({
		url: process.env.SUPABASE_URL,
		serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
	})

	// Protected API routes
	app.use('/api/*', createAuthMiddleware(supabaseClient))
	app.route('/api/people', createPeopleRoutes(supabaseClient))
	app.route('/api/introductions', createIntroductionsRoutes(supabaseClient))
	app.route('/api/feedback', createFeedbackRoutes(supabaseClient))
	app.route('/api/matches', createMatchesRoutes(supabaseClient))
}

// Export for Bun server
export default {
	port: Number(process.env.PORT) || 3000,
	fetch: app.fetch.bind(app),
}

export { app }
