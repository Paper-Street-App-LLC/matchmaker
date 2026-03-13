import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListPromptsRequestSchema,
	GetPromptRequestSchema,
	ListResourcesRequestSchema,
	ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadWidget(filename: string): string {
	const path = join(__dirname, 'widget', filename)
	try {
		return readFileSync(path, 'utf-8')
	} catch {
		throw new Error(`Widget file not found: ${path}. Run 'npm run build:widget' in the playground directory first.`)
	}
}

const MATCHES_WIDGET_URI = 'ui://matches/widget.html'
const matchesWidgetHtml = loadWidget('widget.html')
const PERSON_WIDGET_URI = 'ui://person/widget.html'
const personWidgetHtml = loadWidget('person-widget.html')
const INTRODUCTIONS_WIDGET_URI = 'ui://introductions/widget.html'
const introductionsWidgetHtml = loadWidget('introductions-widget.html')
const INTRODUCTION_WIDGET_URI = 'ui://introduction/widget.html'
const introductionWidgetHtml = loadWidget('introduction-widget.html')
const FEEDBACK_WIDGET_URI = 'ui://feedback/widget.html'
const feedbackWidgetHtml = loadWidget('feedback-widget.html')
import { loadConfig } from './config.js'
import { ApiClient, IApiClient } from './api.js'
import { createToolHandlers, isValidToolName } from './handlers.js'
import { prompts, getPrompt } from './prompts.js'

export function createServer(apiClient: IApiClient) {
	let server = new Server(
		{
			name: 'matchmaker-mcp',
			version: '1.0.0',
		},
		{
			capabilities: {
				tools: {},
				prompts: {},
				resources: {},
			},
		}
	)

	// Register tools
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
				description: 'Look up a matchmaker client profile by ID',
				_meta: { ui: { resourceUri: PERSON_WIDGET_URI } },
				inputSchema: {
					type: 'object',
					properties: {
						id: { type: 'string', description: 'Person ID' },
					},
					required: ['id'],
				},
			},
			{
				name: 'update_person',
				description: "Update a matchmaker client's profile information",
				inputSchema: {
					type: 'object',
					properties: {
						id: { type: 'string', description: 'Person ID' },
						name: { type: 'string', description: 'Person name' },
						age: { type: 'number', description: 'Person age' },
						location: { type: 'string', description: 'Person location' },
						gender: { type: 'string', description: 'Person gender' },
						preferences: { type: 'object', description: 'Person preferences' },
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
				description: 'List all introductions. Use this to browse all introductions or to find an introduction ID before calling get_introduction.',
				_meta: { ui: { resourceUri: INTRODUCTIONS_WIDGET_URI } },
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
				_meta: { ui: { resourceUri: MATCHES_WIDGET_URI } },
				inputSchema: {
					type: 'object',
					properties: {
						person_id: { type: 'string', description: 'Person ID to find matches for' },
					},
					required: ['person_id'],
				},
			},
			{
				name: 'delete_person',
				description: 'Remove a client from the matchmaker roster (sets active=false)',
				inputSchema: {
					type: 'object',
					properties: {
						id: { type: 'string', description: 'Person ID' },
					},
					required: ['id'],
				},
			},
			{
				name: 'get_introduction',
				description: 'Get full details of a specific introduction by ID. If the user asks about an introduction by person names but you do not have the ID, first call list_introductions to find it, then call get_introduction with that ID.',
				_meta: { ui: { resourceUri: INTRODUCTION_WIDGET_URI } },
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
				_meta: { ui: { resourceUri: FEEDBACK_WIDGET_URI } },
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

	// Create tool handlers with discriminated union pattern
	let toolHandlers = createToolHandlers(apiClient)

	// Handle tool calls using lookup-based dispatch
	server.setRequestHandler(CallToolRequestSchema, async request => {
		let { name, arguments: args } = request.params

		try {
			if (!isValidToolName(name)) {
				throw new Error(`Unknown tool: ${name}`)
			}
			return await toolHandlers[name](args)
		} catch (error) {
			let errorMessage = 'Unknown error'
			if (error instanceof Error) {
				errorMessage = error.message
				console.error(`Tool [${name}] error:`, error.message)
				console.error(error.stack)
			} else if (typeof error === 'string') {
				errorMessage = error
				console.error(`Tool [${name}] error:`, error)
			}
			return {
				content: [
					{
						type: 'text',
						text: `Error: ${errorMessage}`,
					},
				],
				isError: true,
			}
		}
	})

	// Register prompts
	server.setRequestHandler(ListPromptsRequestSchema, async () => ({
		prompts,
	}))

	server.setRequestHandler(GetPromptRequestSchema, async request => {
		let { name } = request.params
		return getPrompt(name)
	})

	// Register resources
	server.setRequestHandler(ListResourcesRequestSchema, async () => ({
		resources: [
			{
				uri: MATCHES_WIDGET_URI,
				name: 'Matches Widget',
				mimeType: 'text/html;profile=mcp-app',
			},
			{
				uri: PERSON_WIDGET_URI,
				name: 'Person Profile Widget',
				mimeType: 'text/html;profile=mcp-app',
			},
			{
				uri: INTRODUCTIONS_WIDGET_URI,
				name: 'Introductions Dashboard Widget',
				mimeType: 'text/html;profile=mcp-app',
			},
			{
				uri: INTRODUCTION_WIDGET_URI,
				name: 'Introduction Detail Widget',
				mimeType: 'text/html;profile=mcp-app',
			},
			{
				uri: FEEDBACK_WIDGET_URI,
				name: 'Feedback Thread Widget',
				mimeType: 'text/html;profile=mcp-app',
			},
		],
	}))

	server.setRequestHandler(ReadResourceRequestSchema, async request => {
		if (request.params.uri === MATCHES_WIDGET_URI) {
			return {
				contents: [
					{
						uri: MATCHES_WIDGET_URI,
						mimeType: 'text/html;profile=mcp-app',
						text: matchesWidgetHtml,
					},
				],
			}
		}
		if (request.params.uri === PERSON_WIDGET_URI) {
			return {
				contents: [
					{
						uri: PERSON_WIDGET_URI,
						mimeType: 'text/html;profile=mcp-app',
						text: personWidgetHtml,
					},
				],
			}
		}
		if (request.params.uri === INTRODUCTIONS_WIDGET_URI) {
			return { contents: [{ uri: INTRODUCTIONS_WIDGET_URI, mimeType: 'text/html;profile=mcp-app', text: introductionsWidgetHtml }] }
		}
		if (request.params.uri === INTRODUCTION_WIDGET_URI) {
			return { contents: [{ uri: INTRODUCTION_WIDGET_URI, mimeType: 'text/html;profile=mcp-app', text: introductionWidgetHtml }] }
		}
		if (request.params.uri === FEEDBACK_WIDGET_URI) {
			return { contents: [{ uri: FEEDBACK_WIDGET_URI, mimeType: 'text/html;profile=mcp-app', text: feedbackWidgetHtml }] }
		}
		throw new Error(`Resource not found: ${request.params.uri}`)
	})

	return server
}

async function runServer() {
	let config = await loadConfig()
	let apiClient = new ApiClient(config)
	let server = createServer(apiClient)
	let transport = new StdioServerTransport()

	// Set up signal handlers for graceful shutdown
	let shutdown = async () => {
		console.error('Shutting down MCP server...')
		await transport.close()
		process.exit(0)
	}

	process.on('SIGTERM', shutdown)
	process.on('SIGINT', shutdown)

	// Connect and start listening
	await server.connect(transport)
	console.error('MCP Server running on stdio')
}

// Run server with error handling
if (import.meta.main) {
	runServer().catch(error => {
		console.error('Fatal error in MCP server:', error)
		process.exit(1)
	})
}
