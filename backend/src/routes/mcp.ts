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
import {
	prompts,
	getPrompt,
	buildMcpToolList,
	getToolDefinition,
	type ToolName,
	type Decision,
	type IntroductionStatus,
	type PersonUpdate,
} from '@matchmaker/shared'
import { parsePreferences } from '../schemas/preferences'
import {
	toFeedbackResponseDTO,
	toIntroductionResponseDTO,
	toMatchDecisionResponseDTO,
	toMatchSuggestionResponseDTO,
	toPersonResponseDTO,
} from '../dto'
import type { UseCases } from '../container'
import type { UseCaseError, UseCaseResult } from '../usecases'

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

type ToolErrorOverrides = Partial<Record<UseCaseError['code'], string>>

let unwrap = <T>(result: UseCaseResult<T>, overrides: ToolErrorOverrides = {}): T => {
	if (result.ok) return result.data
	throw new Error(overrides[result.error.code] ?? result.error.message)
}

let notFoundPerson: ToolErrorOverrides = { not_found: 'Person not found' }
let notFoundIntroduction: ToolErrorOverrides = { not_found: 'Introduction not found' }
let notFoundFeedback: ToolErrorOverrides = { not_found: 'Feedback not found' }

type ToolHandler = (args: Record<string, unknown>, userId: string) => Promise<unknown>

let buildDispatchTable = (usecases: UseCases): Record<ToolName, ToolHandler> => ({
	add_person: async (args, userId) => {
		let result = await usecases.createPerson.execute({
			matchmakerId: userId,
			name: args.name as string,
		})
		return toPersonResponseDTO(unwrap(result))
	},

	list_people: async (_args, userId) => {
		let result = await usecases.listPeopleForMatchmaker.execute({ matchmakerId: userId })
		return unwrap(result).map(toPersonResponseDTO)
	},

	get_person: async args => {
		let result = await usecases.getPersonById.execute({ personId: args.id as string })
		return toPersonResponseDTO(unwrap(result, notFoundPerson))
	},

	update_person: async (args, userId) => {
		let { id, preferences, ...rest } = args as Record<string, unknown>
		let patch: PersonUpdate = { ...(rest as Partial<PersonUpdate>) }
		if (preferences === null) {
			patch.preferences = null
		} else if (preferences !== undefined) {
			patch.preferences = parsePreferences(preferences as Record<string, unknown>)
		}
		let result = await usecases.updatePerson.execute({
			matchmakerId: userId,
			personId: id as string,
			patch,
		})
		return toPersonResponseDTO(unwrap(result, notFoundPerson))
	},

	delete_person: async (args, userId) => {
		let result = await usecases.deletePerson.execute({
			matchmakerId: userId,
			personId: args.id as string,
		})
		return toPersonResponseDTO(unwrap(result, notFoundPerson))
	},

	create_introduction: async (args, userId) => {
		let result = await usecases.createIntroduction.execute({
			matchmakerId: userId,
			personAId: args.person_a_id as string,
			personBId: args.person_b_id as string,
			notes: (args.notes as string | undefined) ?? null,
		})
		return toIntroductionResponseDTO(unwrap(result))
	},

	list_introductions: async (_args, userId) => {
		let result = await usecases.listIntroductionsForMatchmaker.execute({
			matchmakerId: userId,
		})
		return unwrap(result).map(toIntroductionResponseDTO)
	},

	update_introduction: async (args, userId) => {
		let result = await usecases.updateIntroduction.execute({
			matchmakerId: userId,
			introductionId: args.id as string,
			status: args.status as IntroductionStatus | undefined,
			notes: args.notes as string | undefined,
		})
		return toIntroductionResponseDTO(unwrap(result, notFoundIntroduction))
	},

	get_introduction: async (args, userId) => {
		let result = await usecases.getIntroductionById.execute({
			matchmakerId: userId,
			introductionId: args.id as string,
		})
		return toIntroductionResponseDTO(unwrap(result, notFoundIntroduction))
	},

	find_matches: async (args, userId) => {
		let result = await usecases.findMatchesForPerson.execute({
			matchmakerId: userId,
			personId: args.person_id as string,
		})
		return unwrap(result, notFoundPerson).map(toMatchSuggestionResponseDTO)
	},

	record_decision: async (args, userId) => {
		let result = await usecases.recordMatchDecision.execute({
			matchmakerId: userId,
			personId: args.person_id as string,
			candidateId: args.candidate_id as string,
			decision: args.decision as Decision,
			declineReason: (args.decline_reason as string | undefined) ?? null,
		})
		return toMatchDecisionResponseDTO(unwrap(result, notFoundPerson))
	},

	list_decisions: async (args, userId) => {
		let result = await usecases.listMatchDecisions.execute({
			matchmakerId: userId,
			personId: args.person_id as string,
		})
		return unwrap(result, notFoundPerson).map(toMatchDecisionResponseDTO)
	},

	submit_feedback: async args => {
		let result = await usecases.submitFeedback.execute({
			introductionId: args.introduction_id as string,
			fromPersonId: args.from_person_id as string,
			content: args.content as string,
			sentiment: args.sentiment as string | undefined,
		})
		return toFeedbackResponseDTO(unwrap(result))
	},

	list_feedback: async args => {
		let result = await usecases.listFeedback.execute({
			introductionId: args.introduction_id as string,
		})
		return unwrap(result).map(toFeedbackResponseDTO)
	},

	get_feedback: async args => {
		let result = await usecases.getFeedback.execute({ feedbackId: args.id as string })
		return toFeedbackResponseDTO(unwrap(result, notFoundFeedback))
	},
})

export let createMcpRoutes = (supabaseClient: SupabaseClient, usecases: UseCases) => {
	let app = new Hono<Env>()

	let dispatchTable = buildDispatchTable(usecases)

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

		// Handle tool calls by dispatching to the corresponding use case.
		server.setRequestHandler(CallToolRequestSchema, async request => {
			let { name, arguments: rawArgs } = request.params

			try {
				let toolDef = getToolDefinition(name)
				if (!toolDef) throw new Error(`Unknown tool: ${name}`)

				let parsed = toolDef.inputSchema.safeParse(rawArgs ?? {})
				if (!parsed.success) {
					let detail = parsed.error.issues
						.map(i => `${i.path.join('.') || '<root>'}: ${i.message}`)
						.join('; ')
					throw new Error(`Invalid arguments for ${name}: ${detail}`)
				}

				let handler = dispatchTable[name as ToolName]
				if (!handler) throw new Error(`Unknown tool: ${name}`)

				let data = await handler(parsed.data as Record<string, unknown>, userId)
				return {
					content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
				}
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
