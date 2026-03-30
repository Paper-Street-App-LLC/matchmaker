import { Hono } from 'hono'

let app = new Hono()

app.get('/health', c => {
	return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

export default {
	port: Number(process.env.PORT) || 3001,
	fetch: app.fetch.bind(app),
}

export { app }
