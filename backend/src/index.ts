import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { createSupabaseClient } from './lib/supabase'
import { createAuthMiddleware } from './middleware/auth'
import { createPeopleRoutes } from './routes/people'

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

// Initialize Supabase client and protected routes only if env vars are set
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
	let supabaseClient = createSupabaseClient({
		url: process.env.SUPABASE_URL,
		serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
	})

	// Protected API routes
	app.use('/api/*', createAuthMiddleware(supabaseClient))
	app.route('/api/people', createPeopleRoutes(supabaseClient))
}

// Export for Bun server
export default {
	port: Number(process.env.PORT) || 3000,
	fetch: app.fetch.bind(app),
}

export { app }
