import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListPromptsRequestSchema,
	GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import type { SupabaseClient } from '../lib/supabase'
import { prompts, getPrompt, buildMcpToolList, getToolDefinition } from '@matchmaker/shared'
import { parsePreferences } from '../schemas/preferences'
import {
	SupabaseIntroductionRepository,
	SupabaseMatchDecisionRepository,
	SupabasePersonRepository,
} from '../adapters/supabase'
import { matchFinder } from '../services/matchFinder'
import { CreateIntroduction, systemClock, uuidGenerator } from '../usecases'

type Env = {
	Variables: {
		userId: string
	}
}

// Error logging utility
export type ErrorLogEntry = {
	timestamp: string
	type: string
	path: string
	status: number
	message: string
}

export let logError = (entry: ErrorLogEntry) => {
	console.error(
		entry.timestamp,
		JSON.stringify({
			type: entry.type,
			path: entry.path,
			status: entry.status,
			message: entry.message,
		})
	)
}

export let createMcpRoutes = (supabaseClient: SupabaseClient) => {
	let app = new Hono<Env>()

	// CORS middleware specifically for claude.ai
	app.use(
		'*',
		cors({
			origin: origin => (origin === 'https://claude.ai' || !origin ? origin || '*' : null),
			allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
			allowHeaders: ['Authorization', 'Content-Type', 'Accept', 'Mcp-Session-Id'],
			exposeHeaders: ['Mcp-Session-Id'],
			credentials: true,
		})
	)

	// Required scope for MCP access
	let REQUIRED_SCOPE = 'mcp:access'

	// Check if user has the required scope
	// Uses type assertion since app_metadata.scopes is a custom field
	let hasRequiredScope = (user: { app_metadata?: Record<string, unknown> }): boolean => {
		// If scopes are not explicitly set, allow access by default
		// This enables all authenticated users to access MCP unless explicitly restricted
		let scopes = user.app_metadata?.scopes as string[] | undefined
		if (scopes === undefined) {
			return true
		}
		// If scopes are explicitly set, check for required scope
		return scopes.includes(REQUIRED_SCOPE)
	}

	// Helper to get base URL respecting proxy headers (e.g., Railway, Cloudflare)
	let getBaseUrl = (c: Context<Env>): string => {
		let url = new URL(c.req.url)
		let proto = c.req.header('X-Forwarded-Proto') || url.protocol.replace(':', '')
		let host = c.req.header('X-Forwarded-Host') || url.host
		return `${proto}://${host}`
	}

	// Authentication middleware
	let authMiddleware = async (c: Context<Env>, next: Next) => {
		let authHeader = c.req.header('Authorization')
		let path = new URL(c.req.url).pathname

		if (!authHeader) {
			logError({
				timestamp: new Date().toISOString(),
				type: 'AuthenticationError',
				path,
				status: 401,
				message: 'Missing Authorization header',
			})
			let baseUrl = getBaseUrl(c)
			throw new HTTPException(401, {
				message: 'Unauthorized',
				res: new Response('Unauthorized', {
					status: 401,
					headers: {
						'WWW-Authenticate': `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
					},
				}),
			})
		}

		let token = authHeader.replace('Bearer ', '')

		if (token === authHeader) {
			logError({
				timestamp: new Date().toISOString(),
				type: 'AuthenticationError',
				path,
				status: 401,
				message: 'Invalid Authorization header format',
			})
			let baseUrl = getBaseUrl(c)
			throw new HTTPException(401, {
				message: 'Unauthorized',
				res: new Response('Unauthorized', {
					status: 401,
					headers: {
						'WWW-Authenticate': `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
					},
				}),
			})
		}

		let { data, error } = await supabaseClient.auth.getUser(token)

		if (error || !data.user) {
			logError({
				timestamp: new Date().toISOString(),
				type: 'AuthenticationError',
				path,
				status: 401,
				message: error?.message || 'Invalid token',
			})
			let baseUrl = getBaseUrl(c)
			throw new HTTPException(401, {
				message: 'Unauthorized',
				res: new Response('Unauthorized', {
					status: 401,
					headers: {
						'WWW-Authenticate': `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`,
					},
				}),
			})
		}

		// Check for required scope
		if (!hasRequiredScope(data.user)) {
			logError({
				timestamp: new Date().toISOString(),
				type: 'AuthorizationError',
				path,
				status: 403,
				message: 'User lacks required scope: mcp:access',
			})
			throw new HTTPException(403, { message: 'Forbidden: insufficient scope' })
		}

		c.set('userId', data.user.id)
		await next()
	}

	// Create MCP server with tools
	let createMcpServer = (userId: string) => {
		let server = new Server(
			{
				name: 'matchmaker-mcp',
				version: '1.0.0',
			},
			{
				capabilities: {
					tools: {},
					prompts: {},
				},
			}
		)

		// Register tools — sourced from the shared MCP tool registry so the
		// stdio and streamable-HTTP transports stay in sync.
		server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: buildMcpToolList(),
		}))

		// Register prompts
		server.setRequestHandler(ListPromptsRequestSchema, async () => ({
			prompts,
		}))

		server.setRequestHandler(GetPromptRequestSchema, async request => {
			let { name } = request.params
			return getPrompt(name)
		})

		// Handle tool calls by making direct database calls
		server.setRequestHandler(CallToolRequestSchema, async request => {
			let { name, arguments: rawArgs } = request.params

			try {
				let toolDef = getToolDefinition(name)
				let args: Record<string, unknown> | undefined = rawArgs
				if (toolDef) {
					let parsed = toolDef.inputSchema.safeParse(rawArgs ?? {})
					if (!parsed.success) {
						let detail = parsed.error.issues
							.map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
							.join('; ')
						throw new Error(`Invalid arguments for ${name}: ${detail}`)
					}
					args = parsed.data
				}

				if (name === 'add_person') {
					if (
						!args ||
						typeof args !== 'object' ||
						!('name' in args) ||
						typeof args.name !== 'string'
					) {
						throw new Error('Invalid arguments: name is required and must be a string')
					}
					let { data, error } = await supabaseClient
						.from('people')
						.insert({ name: args.name, matchmaker_id: userId })
						.select()
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'list_people') {
					let { data, error } = await supabaseClient
						.from('people')
						.select('*')
						.eq('matchmaker_id', userId)
						.eq('active', true)
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'get_person') {
					if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
						throw new Error('Invalid arguments: id is required and must be a string')
					}
					// Mirrors find_matches' cross-matchmaker pool (active people only):
					// any active candidate that can surface as a match must also be
					// inspectable by id.
					let { data, error } = await supabaseClient
						.from('people')
						.select('*')
						.eq('id', args.id)
						.eq('active', true)
						.maybeSingle()
					if (error) throw new Error(error.message)
					if (!data) throw new Error('Person not found')
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'update_person') {
					if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
						throw new Error('Invalid arguments: id is required and must be a string')
					}
					let { id, ...updates } = args as Record<string, unknown>
					if (updates.preferences != null) {
						updates.preferences = parsePreferences(updates.preferences as Record<string, unknown>)
					}
					let { data, error } = await supabaseClient
						.from('people')
						.update(updates)
						.eq('id', id)
						.eq('matchmaker_id', userId)
						.select()
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'create_introduction') {
					if (
						!args ||
						typeof args !== 'object' ||
						!('person_a_id' in args) ||
						typeof args.person_a_id !== 'string' ||
						!('person_b_id' in args) ||
						typeof args.person_b_id !== 'string'
					) {
						throw new Error(
							'Invalid arguments: person_a_id and person_b_id are required and must be strings'
						)
					}
					let { person_a_id, person_b_id, notes } = args as {
						person_a_id: string
						person_b_id: string
						notes?: string
					}

					let personRepo = new SupabasePersonRepository(supabaseClient)
					let introductionRepo = new SupabaseIntroductionRepository(supabaseClient)
					let usecase = new CreateIntroduction({
						personRepo,
						introductionRepo,
						clock: systemClock,
						ids: uuidGenerator,
					})
					let result = await usecase.execute({
						matchmakerId: userId,
						personAId: person_a_id,
						personBId: person_b_id,
						notes: notes ?? null,
					})
					if (!result.ok) throw new Error(result.error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
					}
				}

				if (name === 'list_introductions') {
					let { data, error } = await supabaseClient
						.from('introductions')
						.select('*')
						.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'update_introduction') {
					if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
						throw new Error('Invalid arguments: id is required and must be a string')
					}
					let { id, ...updates } = args as Record<string, unknown>
					let { data, error } = await supabaseClient
						.from('introductions')
						.update(updates)
						.eq('id', id)
						.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
						.select()
						.maybeSingle()
					if (error) throw new Error(error.message)
					if (!data) throw new Error('Introduction not found')
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'find_matches') {
					if (
						!args ||
						typeof args !== 'object' ||
						!('person_id' in args) ||
						typeof args.person_id !== 'string'
					) {
						throw new Error('Invalid arguments: person_id is required and must be a string')
					}
					// Verify person belongs to this matchmaker
					let { data: person, error: personError } = await supabaseClient
						.from('people')
						.select('id')
						.eq('id', args.person_id)
						.eq('matchmaker_id', userId)
						.maybeSingle()
					if (personError) throw new Error(personError.message)
					if (!person) throw new Error('Person not found')

					let personRepo = new SupabasePersonRepository(supabaseClient)
					let matchDecisionRepo = new SupabaseMatchDecisionRepository(supabaseClient)
					let matches = await matchFinder(
						args.person_id,
						userId,
						personRepo,
						matchDecisionRepo,
					)
					return {
						content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
					}
				}

				if (name === 'record_decision') {
					if (
						!args ||
						typeof args !== 'object' ||
						!('person_id' in args) ||
						typeof args.person_id !== 'string' ||
						!('candidate_id' in args) ||
						typeof args.candidate_id !== 'string' ||
						!('decision' in args) ||
						typeof args.decision !== 'string'
					) {
						throw new Error(
							'Invalid arguments: person_id, candidate_id, and decision are required'
						)
					}
					let { person_id, candidate_id, decision, decline_reason } = args as {
						person_id: string
						candidate_id: string
						decision: string
						decline_reason?: string
					}
					if (decision !== 'accepted' && decision !== 'declined') {
						throw new Error("decision must be 'accepted' or 'declined'")
					}
					// Verify person belongs to this matchmaker
					let { data: person, error: personError } = await supabaseClient
						.from('people')
						.select('id')
						.eq('id', person_id)
						.eq('matchmaker_id', userId)
						.maybeSingle()
					if (personError) throw new Error(personError.message)
					if (!person) throw new Error('Person not found')

					let { data, error } = await supabaseClient
						.from('match_decisions')
						.insert({
							matchmaker_id: userId,
							person_id,
							candidate_id,
							decision,
							decline_reason: decline_reason || null,
						})
						.select()
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'list_decisions') {
					if (
						!args ||
						typeof args !== 'object' ||
						!('person_id' in args) ||
						typeof args.person_id !== 'string'
					) {
						throw new Error('Invalid arguments: person_id is required and must be a string')
					}
					// Verify person belongs to this matchmaker
					let { data: person, error: personError } = await supabaseClient
						.from('people')
						.select('id')
						.eq('id', args.person_id)
						.eq('matchmaker_id', userId)
						.maybeSingle()
					if (personError) throw new Error(personError.message)
					if (!person) throw new Error('Person not found')

					let { data, error } = await supabaseClient
						.from('match_decisions')
						.select('*')
						.eq('person_id', args.person_id)
						.eq('matchmaker_id', userId)
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'delete_person') {
					if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
						throw new Error('Invalid arguments: id is required and must be a string')
					}
					let { data, error } = await supabaseClient
						.from('people')
						.update({ active: false })
						.eq('id', args.id)
						.eq('matchmaker_id', userId)
						.select()
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'get_introduction') {
					if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
						throw new Error('Invalid arguments: id is required and must be a string')
					}
					let { data, error } = await supabaseClient
						.from('introductions')
						.select('*')
						.eq('id', args.id)
						.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
						.maybeSingle()
					if (error) throw new Error(error.message)
					if (!data) throw new Error('Introduction not found')
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'submit_feedback') {
					if (
						!args ||
						typeof args !== 'object' ||
						!('introduction_id' in args) ||
						typeof args.introduction_id !== 'string' ||
						!('from_person_id' in args) ||
						typeof args.from_person_id !== 'string' ||
						!('content' in args) ||
						typeof args.content !== 'string'
					) {
						throw new Error(
							'Invalid arguments: introduction_id, from_person_id, and content are required and must be strings'
						)
					}
					let { introduction_id, from_person_id, content, sentiment } = args as {
						introduction_id: string
						from_person_id: string
						content: string
						sentiment?: string
					}
					let { data, error } = await supabaseClient
						.from('feedback')
						.insert({
							introduction_id,
							from_person_id,
							content,
							sentiment: sentiment || null,
						})
						.select()
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'list_feedback') {
					if (
						!args ||
						typeof args !== 'object' ||
						!('introduction_id' in args) ||
						typeof args.introduction_id !== 'string'
					) {
						throw new Error('Invalid arguments: introduction_id is required and must be a string')
					}
					let { data, error } = await supabaseClient
						.from('feedback')
						.select('*')
						.eq('introduction_id', args.introduction_id)
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'get_feedback') {
					if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
						throw new Error('Invalid arguments: id is required and must be a string')
					}
					let { data, error } = await supabaseClient
						.from('feedback')
						.select('*')
						.eq('id', args.id)
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				throw new Error(`Unknown tool: ${name}`)
			} catch (error) {
				let errorMessage = 'Unknown error'
				if (error instanceof Error) {
					errorMessage = error.message
				} else if (typeof error === 'string') {
					errorMessage = error
				}
				return {
					content: [{ type: 'text', text: `Error: ${errorMessage}` }],
					isError: true,
				}
			}
		})

		return server
	}

	// Handle all MCP requests
	app.all('/', authMiddleware, async c => {
		let userId = c.get('userId')
		let path = new URL(c.req.url).pathname

		// Create transport in stateless mode (no session ID generator)
		let transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
			enableJsonResponse: true,
		})

		// Create and connect MCP server
		let server = createMcpServer(userId)
		await server.connect(transport)

		// Handle the request
		try {
			let response = await transport.handleRequest(c.req.raw)
			return response
		} catch (error) {
			let errorType = error instanceof Error ? error.constructor.name : 'UnknownError'
			let errorMessage = error instanceof Error ? error.message : String(error)
			let status = error instanceof SyntaxError ? 400 : 500

			logError({
				timestamp: new Date().toISOString(),
				type: errorType,
				path,
				status,
				message: errorMessage,
			})

			if (error instanceof SyntaxError) {
				return c.json({ error: 'Invalid JSON' }, 400)
			}
			throw error
		}
	})

	return app
}
