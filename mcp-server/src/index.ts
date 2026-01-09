import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { loadConfig } from './config.js'
import { ApiClient } from './api.js'

export function createServer(apiClient: ApiClient) {
	let server = new Server(
		{
			name: 'matchmaker-mcp',
			version: '1.0.0',
		},
		{
			capabilities: {
				tools: {},
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
		],
	}))

	// Handle tool calls
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
				let result = await apiClient.addPerson(args.name)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				}
			}

			if (name === 'list_people') {
				let result = await apiClient.listPeople()
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				}
			}

			if (name === 'get_person') {
				if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
					throw new Error('Invalid arguments: id is required and must be a string')
				}
				let result = await apiClient.getPerson(args.id)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				}
			}

			if (name === 'update_person') {
				if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
					throw new Error('Invalid arguments: id is required and must be a string')
				}
				let { id, ...updates } = args as {
					id: string
					name?: string
					age?: number
					location?: string
					gender?: string
					preferences?: object
					personality?: object
					notes?: string
				}
				let result = await apiClient.updatePerson(id, updates)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
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
				let result = await apiClient.createIntroduction(person_a_id, person_b_id, notes)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				}
			}

			if (name === 'list_introductions') {
				let result = await apiClient.listIntroductions()
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
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
