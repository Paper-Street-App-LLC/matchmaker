import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { loadConfig } from './config.js'
import { ApiClient } from './api.js'
import type { Person, Match, Introduction, Feedback, IApiClient } from './api.js'
import { createServer } from './index.js'

// ---------------------------------------------------------------------------
// Mock API client — used when MOCK=true, no backend needed
// ---------------------------------------------------------------------------

class MockApiClient implements IApiClient {
	private people: Person[] = [
		{
			id: 'mock-1', name: 'Jordan Lee', matchmaker_id: 'mm-1',
			age: 29, location: 'San Francisco', gender: 'woman',
			personality: { traits: ['curious', 'adventurous'], interests: ['hiking', 'coffee', 'architecture'] },
			preferences: { ageRange: { min: 27, max: 36 }, genders: ['man'], locations: ['San Francisco', 'New York'] },
			notes: `Met at the SF design week event. Very intentional about what she's looking for — values depth over chemistry.`,
			active: true, created_at: '', updated_at: '',
		},
		{
			id: 'mock-2', name: 'Morgan Patel', matchmaker_id: 'mm-1',
			age: 32, location: 'New York', gender: 'woman',
			personality: { traits: ['ambitious', 'thoughtful'], interests: ['travel', 'books', 'teaching'] },
			preferences: { ageRange: { min: 30, max: 40 }, genders: ['man', 'woman'] },
			notes: `Referred by a client. Recently moved back from London. Ready to settle down but won't rush it.`,
			active: true, created_at: '', updated_at: '',
		},
		{
			id: 'mock-3', name: 'Sam Rivera', matchmaker_id: 'mm-1',
			age: 27, location: 'Austin', gender: 'woman',
			personality: { traits: ['creative', 'warm'], interests: ['yoga', 'music', 'startups'] },
			preferences: { ageRange: { min: 25, max: 34 }, genders: ['man'], locations: ['Austin', 'Remote-friendly'] },
			notes: 'Founder energy — very driven but craves someone grounded. Loves live music and spontaneous road trips.',
			active: true, created_at: '', updated_at: '',
		},
	]

	async addPerson(name: string): Promise<Person> {
		const p: Person = { id: `mock-${Date.now()}`, name, matchmaker_id: 'mm-1', active: true, created_at: '', updated_at: '' }
		this.people.push(p)
		return p
	}
	async listPeople(): Promise<Person[]> { return this.people }
	async getPerson(id: string): Promise<Person> {
		const p = this.people.find(p => p.id === id)
		if (!p) throw new Error(`Person ${id} not found`)
		return p
	}
	async updatePerson(id: string, updates: Partial<Person>): Promise<Person> {
		const p = await this.getPerson(id)
		Object.assign(p, updates)
		return p
	}
	async findMatches(personId: string): Promise<Match[]> {
		const subject = await this.getPerson(personId)
		const subjectTraits = subject.personality?.traits ?? []
		return this.people
			.filter(p => p.id !== personId)
			.map(p => {
				const traits = p.personality?.traits ?? []
				const interests = p.personality?.interests ?? []
				const firstName = p.name.split(' ')[0]
				const sharedTrait = subjectTraits.find(t => traits.includes(t))
				const note = sharedTrait
					? `${firstName}'s ${traits[0]} and ${traits[1] ?? 'open'} nature pairs naturally with yours — you both share a ${sharedTrait} side, which tends to make for genuine connection.`
					: `${firstName}'s ${traits[0] ?? 'warm'} personality and passion for ${interests[0] ?? 'new experiences'} complement your profile well. A strong foundation for something real.`
				return {
					person: { id: p.id, name: p.name, age: p.age, location: p.location },
					compatibility_score: Math.floor(Math.random() * 30) + 65,
					match_reasons: interests.slice(0, 2).map(i => `Shared interest in ${i}`),
					about: interests.join(', '),
					matchmaker_note: note,
				}
			})
	}
	private introductions: Introduction[] = [
		{ id: 'intro-1', matchmaker_id: 'mm-1', person_a_id: 'mock-1', person_b_id: 'mock-2', status: 'dating', notes: 'Great first date at Bar Agricole. Both expressed interest in a second meeting.', created_at: '2026-01-10T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
		{ id: 'intro-2', matchmaker_id: 'mm-1', person_a_id: 'mock-1', person_b_id: 'mock-3', status: 'pending', notes: 'Intro email sent. Waiting on Jordan to respond.', created_at: '2026-02-20T00:00:00Z', updated_at: '2026-02-20T00:00:00Z' },
		{ id: 'intro-3', matchmaker_id: 'mm-1', person_a_id: 'mock-2', person_b_id: 'mock-3', status: 'declined', notes: 'Morgan felt the distance was too much of an obstacle.', created_at: '2025-11-05T00:00:00Z', updated_at: '2025-11-12T00:00:00Z' },
	]
	async createIntroduction(a: string, b: string, notes?: string): Promise<Introduction> {
		const intro: Introduction = { id: `mock-intro-${Date.now()}`, matchmaker_id: 'mm-1', person_a_id: a, person_b_id: b, status: 'pending', notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
		this.introductions.push(intro)
		return intro
	}
	async listIntroductions(): Promise<Introduction[]> { return this.introductions }
	async updateIntroduction(id: string, updates: { status?: 'pending' | 'accepted' | 'declined' | 'dating' | 'ended'; notes?: string }): Promise<Introduction> {
		const intro = this.introductions.find(i => i.id === id)
		if (!intro) throw new Error(`Introduction ${id} not found`)
		Object.assign(intro, updates, { updated_at: new Date().toISOString() })
		return intro
	}
	async deletePerson(id: string): Promise<Person> { return this.getPerson(id) }
	async getIntroduction(id: string): Promise<Introduction> {
		const intros = await this.listIntroductions()
		const intro = intros.find(i => i.id === id)
		if (!intro) throw new Error(`Introduction ${id} not found`)
		return intro
	}
	async submitFeedback(introduction_id: string, from_person_id: string, content: string, sentiment?: string): Promise<Feedback> {
		return { id: 'mock-fb-1', introduction_id, from_person_id, content, sentiment, created_at: new Date().toISOString() }
	}
	async listFeedback(introduction_id: string): Promise<Feedback[]> {
		return [
			{ id: 'fb-1', introduction_id, from_person_id: 'mock-1', content: `Really enjoyed the evening. We talked for hours and I'd love to see them again.`, sentiment: 'positive', created_at: '2026-02-03T00:00:00Z' },
			{ id: 'fb-2', introduction_id, from_person_id: 'mock-2', content: `Jordan is lovely but I'm not sure there's a romantic spark. Open to a second date though.`, sentiment: 'neutral', created_at: '2026-02-04T00:00:00Z' },
		]
	}
	async getFeedback(id: string): Promise<Feedback> {
		return { id, introduction_id: '', from_person_id: '', content: '', created_at: '' }
	}
}

// ---------------------------------------------------------------------------
// Config + MCP server
// ---------------------------------------------------------------------------

const isMock = process.env.MOCK === 'true'

const config = isMock ? null : await loadConfig()
const apiClient = isMock
	? new MockApiClient()
	: new ApiClient(config!)

if (isMock) console.log('Running in MOCK mode — no backend required')

const mcpServer = createServer(apiClient)

const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
await mcpServer.connect(transport)

// ---------------------------------------------------------------------------
// Minimal OAuth 2.0 (local dev only — auto-approves, returns config token)
// ---------------------------------------------------------------------------

// In-memory code store: code -> accessToken
const pendingCodes = new Map<string, string>()

function getBaseUrl(req: IncomingMessage): string {
	const host = req.headers['x-forwarded-host'] ?? req.headers['host'] ?? 'localhost:3001'
	const proto = req.headers['x-forwarded-proto'] ?? 'http'
	return `${proto}://${host}`
}

function parseQuery(url: string): Record<string, string> {
	const q = new URL(url, 'http://localhost').searchParams
	const out: Record<string, string> = {}
	q.forEach((v, k) => (out[k] = v))
	return out
}

async function readBody(req: IncomingMessage): Promise<Record<string, string>> {
	return new Promise(resolve => {
		let data = ''
		req.on('data', chunk => (data += chunk))
		req.on('end', () => {
			const out: Record<string, string> = {}
			new URLSearchParams(data).forEach((v, k) => (out[k] = v))
			resolve(out)
		})
	})
}

function json(res: ServerResponse, status: number, body: unknown) {
	const payload = JSON.stringify(body)
	res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
	res.end(payload)
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT ?? '3001', 10)

const httpServer = createHttpServer(async (req, res) => {
	const url = req.url ?? '/'

	// CORS
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id')

	if (req.method === 'OPTIONS') {
		res.writeHead(204)
		res.end()
		return
	}

	// Health
	if (url === '/health' && req.method === 'GET') {
		return json(res, 200, { status: 'healthy' })
	}

	// OAuth: protected resource discovery (RFC 9728)
	if (url === '/.well-known/oauth-protected-resource' && req.method === 'GET') {
		const base = getBaseUrl(req)
		return json(res, 200, { resource: base, authorization_servers: [base] })
	}

	// OAuth: authorization server metadata (RFC 8414)
	if (url === '/.well-known/oauth-authorization-server' && req.method === 'GET') {
		const base = getBaseUrl(req)
		return json(res, 200, {
			issuer: base,
			authorization_endpoint: `${base}/oauth/authorize`,
			token_endpoint: `${base}/oauth/token`,
			registration_endpoint: `${base}/oauth/register`,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code'],
			code_challenge_methods_supported: ['S256'],
		})
	}

	// OAuth: dynamic client registration (just echo back a client_id)
	if (url === '/oauth/register' && req.method === 'POST') {
		return json(res, 201, {
			client_id: 'local-dev-client',
			client_secret_expires_at: 0,
		})
	}

	// OAuth: authorize — auto-approve, redirect straight back with a code
	if (url.startsWith('/oauth/authorize') && req.method === 'GET') {
		const params = parseQuery(url)
		const { redirect_uri, state } = params

		if (!redirect_uri) {
			return json(res, 400, { error: 'missing redirect_uri' })
		}

		// Generate a one-time code and map it to the auth token (static in mock mode)
		const code = crypto.randomUUID()
		pendingCodes.set(code, config?.auth_token ?? 'mock-token')
		// Expire after 5 minutes
		setTimeout(() => pendingCodes.delete(code), 5 * 60 * 1000)

		const redirectUrl = new URL(redirect_uri)
		redirectUrl.searchParams.set('code', code)
		if (state) redirectUrl.searchParams.set('state', state)

		res.writeHead(302, { Location: redirectUrl.toString() })
		res.end()
		return
	}

	// OAuth: token exchange
	if (url === '/oauth/token' && req.method === 'POST') {
		const body = await readBody(req)
		const { code } = body

		if (!code) {
			return json(res, 400, { error: 'invalid_request', error_description: 'code is required' })
		}

		const accessToken = pendingCodes.get(code)
		if (!accessToken) {
			return json(res, 400, { error: 'invalid_grant', error_description: 'code is invalid or expired' })
		}

		pendingCodes.delete(code)

		return json(res, 200, {
			access_token: accessToken,
			token_type: 'Bearer',
			expires_in: 3600,
		})
	}

	// MCP endpoint — ChatGPT sends to both / and /mcp
	if (url === '/mcp' || url === '/') {
		// Require Bearer token
		const auth = req.headers['authorization']
		if (!auth?.startsWith('Bearer ')) {
			res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${getBaseUrl(req)}/.well-known/oauth-protected-resource"`)
			return json(res, 401, { error: 'unauthorized' })
		}

		// Pre-parse body and pass to transport (body stream can only be read once)
		let parsedBody: unknown
		if (req.method === 'POST') {
			const chunks: Buffer[] = []
			for await (const chunk of req) chunks.push(chunk as Buffer)
			const raw = Buffer.concat(chunks).toString()
			try { parsedBody = JSON.parse(raw) } catch { parsedBody = raw }
		}

		try {
			await transport.handleRequest(req, res, parsedBody)
		} catch (error) {
			console.error('MCP request error:', error)
			if (!res.headersSent) {
				json(res, 500, { error: 'Internal server error' })
			}
		}
		return
	}

	res.writeHead(404)
	res.end()
})

httpServer.listen(PORT, () => {
	console.log(`MCP HTTP server  →  http://localhost:${PORT}/mcp`)
	console.log(`Health check     →  http://localhost:${PORT}/health`)
})
