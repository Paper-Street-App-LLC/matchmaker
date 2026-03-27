import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

let app = new Hono()

app.use('*', logger())
app.use('*', cors())

app.get('/health', c => {
	return c.json({ status: 'ok' })
})

export default {
	port: Number(process.env.PORT) || 3001,
	fetch: app.fetch.bind(app),
}

export { app }
