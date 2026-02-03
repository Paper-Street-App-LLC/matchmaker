import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListPromptsRequestSchema,
	GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { loadConfig } from './config.js'
import { ApiClient } from './api.js'
import { createToolHandlers, isValidToolName } from './handlers.js'
import { prompts, getPrompt } from './prompts.js'

export function createServer(apiClient: ApiClient) {
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
				description: "Update a person's profile information",
				inputSchema: {
					type: 'object',
					properties: {
						id: { type: 'string', description: 'Person ID (UUID)' },
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
						person_id: { type: 'string', description: 'Person ID (UUID) to find matches for' },
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
			} else if (typeof error === 'string') {
				errorMessage = error
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
