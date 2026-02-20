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
import { prompts, getPrompt } from '../prompts'

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
			origin: 'https://claude.ai',
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

		// Register tools - these tools call the internal API routes
		server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				{
					name: 'add_person',
					description: 'Add a new person to the matchmaker',
					inputSchema: {
						type: 'object',
						properties: {
							name: { type: 'string', description: 'Person name' },
						},
						required: ['name'],
					},
				},
				{
					name: 'list_people',
					description: 'List all people in the matchmaker',
					inputSchema: {
						type: 'object',
						properties: {},
					},
				},
				{
					name: 'get_person',
					description: 'Retrieve detailed information about a specific person',
					inputSchema: {
						type: 'object',
						properties: {
							id: { type: 'string', description: 'Person ID (UUID)' },
						},
						required: ['id'],
					},
				},
				{
					name: 'update_person',
					description:
						"Update a person's profile information. Use the structured preferences format for the `preferences` field: { aboutMe: { height (cm), build ('slim'|'athletic'|'average'|'curvy'|'heavyset'), fitnessLevel ('sedentary'|'light'|'moderate'|'active'|'very_active'), ethnicity, religion, hasChildren, numberOfChildren, isDivorced, hasTattoos, hasPiercings, isSmoker, occupation, income ('<30k'|'30k-60k'|'60k-100k'|'100k-200k'|'>200k') }, lookingFor: { ageRange: { min, max }, heightRange: { min, max }, fitnessPreference, ethnicityPreference, incomePreference, religionRequired, wantsChildren }, dealBreakers: string[] }",
					inputSchema: {
						type: 'object',
						properties: {
							id: { type: 'string', description: 'Person ID (UUID)' },
							name: { type: 'string', description: 'Person name' },
							age: { type: 'number', description: 'Person age' },
							location: { type: 'string', description: 'Person location' },
							gender: { type: 'string', description: 'Person gender' },
							preferences: {
								type: 'object',
								description:
									'Structured preferences with aboutMe, lookingFor, and dealBreakers sections',
							},
							personality: { type: 'object', description: 'Person personality traits' },
							notes: { type: 'string', description: 'Notes about the person' },
						},
						required: ['id'],
					},
				},
				{
					name: 'create_introduction',
					description: 'Create an introduction between two people',
					inputSchema: {
						type: 'object',
						properties: {
							person_a_id: { type: 'string', description: 'First person ID (UUID)' },
							person_b_id: { type: 'string', description: 'Second person ID (UUID)' },
							notes: { type: 'string', description: 'Notes about the introduction' },
						},
						required: ['person_a_id', 'person_b_id'],
					},
				},
				{
					name: 'list_introductions',
					description: 'List all introductions for the matchmaker',
					inputSchema: {
						type: 'object',
						properties: {},
					},
				},
				{
					name: 'update_introduction',
					description: 'Update introduction status or notes',
					inputSchema: {
						type: 'object',
						properties: {
							id: { type: 'string', description: 'Introduction ID (UUID)' },
							status: {
								type: 'string',
								enum: ['pending', 'accepted', 'declined', 'dating', 'ended'],
								description: 'Introduction status',
							},
							notes: { type: 'string', description: 'Notes about the introduction' },
						},
						required: ['id'],
					},
				},
				{
					name: 'find_matches',
					description: 'Find compatible matches for a person',
					inputSchema: {
						type: 'object',
						properties: {
							person_id: {
								type: 'string',
								description: 'Person ID (UUID) to find matches for',
							},
						},
						required: ['person_id'],
					},
				},
				{
					name: 'delete_person',
					description: 'Soft-delete a person (sets active=false)',
					inputSchema: {
						type: 'object',
						properties: {
							id: { type: 'string', description: 'Person ID (UUID)' },
						},
						required: ['id'],
					},
				},
				{
					name: 'get_introduction',
					description: 'Get details of a specific introduction',
					inputSchema: {
						type: 'object',
						properties: {
							id: { type: 'string', description: 'Introduction ID (UUID)' },
						},
						required: ['id'],
					},
				},
				{
					name: 'submit_feedback',
					description: 'Submit feedback about an introduction',
					inputSchema: {
						type: 'object',
						properties: {
							introduction_id: { type: 'string', description: 'Introduction ID (UUID)' },
							from_person_id: {
								type: 'string',
								description: 'Person ID (UUID) submitting the feedback',
							},
							content: { type: 'string', description: 'Feedback content' },
							sentiment: {
								type: 'string',
								description: 'Feedback sentiment (e.g., positive, negative, neutral)',
							},
						},
						required: ['introduction_id', 'from_person_id', 'content'],
					},
				},
				{
					name: 'list_feedback',
					description: 'Get all feedback for a specific introduction',
					inputSchema: {
						type: 'object',
						properties: {
							introduction_id: { type: 'string', description: 'Introduction ID (UUID)' },
						},
						required: ['introduction_id'],
					},
				},
				{
					name: 'get_feedback',
					description: 'Get a specific feedback record',
					inputSchema: {
						type: 'object',
						properties: {
							id: { type: 'string', description: 'Feedback ID (UUID)' },
						},
						required: ['id'],
					},
				},
			],
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
			let { name, arguments: args } = request.params

			try {
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
					let { data, error } = await supabaseClient
						.from('people')
						.select('*')
						.eq('id', args.id)
						.eq('matchmaker_id', userId)
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'update_person') {
					if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
						throw new Error('Invalid arguments: id is required and must be a string')
					}
					let { id, ...updates } = args as Record<string, unknown>
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
					let { data, error } = await supabaseClient
						.from('introductions')
						.insert({
							matchmaker_id: userId,
							person_a_id,
							person_b_id,
							notes: notes || null,
							status: 'pending',
						})
						.select()
						.single()
					if (error) throw new Error(error.message)
					return {
						content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
					}
				}

				if (name === 'list_introductions') {
					let { data, error } = await supabaseClient
						.from('introductions')
						.select('*')
						.eq('matchmaker_id', userId)
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
						.eq('matchmaker_id', userId)
						.select()
						.single()
					if (error) throw new Error(error.message)
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
					// Verify the person exists and belongs to this user
					let { error: personError } = await supabaseClient
						.from('people')
						.select('id')
						.eq('id', args.person_id)
						.eq('matchmaker_id', userId)
						.single()
					if (personError) throw new Error(personError.message)

					// Get all other active people
					let { data: candidates, error: candidatesError } = await supabaseClient
						.from('people')
						.select('*')
						.eq('matchmaker_id', userId)
						.eq('active', true)
						.neq('id', args.person_id)
					if (candidatesError) throw new Error(candidatesError.message)

					// Simple matching - return candidates with compatibility score
					let matches = (candidates || []).map(candidate => ({
						person: candidate,
						compatibility_score: Math.random(), // Placeholder
						reasons: ['Both are in the matchmaker system'],
					}))
					return {
						content: [{ type: 'text', text: JSON.stringify(matches, null, 2) }],
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
						.eq('matchmaker_id', userId)
						.single()
					if (error) throw new Error(error.message)
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
			enableJsonResponse: false,
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
