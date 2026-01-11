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

			if (name === 'update_introduction') {
				if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
					throw new Error('Invalid arguments: id is required and must be a string')
				}
				let { id, ...updates } = args as {
					id: string
					status?: 'pending' | 'accepted' | 'declined' | 'dating' | 'ended'
					notes?: string
				}
				let result = await apiClient.updateIntroduction(id, updates)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
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
				let result = await apiClient.findMatches(args.person_id)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				}
			}

			if (name === 'delete_person') {
				if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
					throw new Error('Invalid arguments: id is required and must be a string')
				}
				let result = await apiClient.deletePerson(args.id)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				}
			}

			if (name === 'get_introduction') {
				if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
					throw new Error('Invalid arguments: id is required and must be a string')
				}
				let result = await apiClient.getIntroduction(args.id)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
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
				let result = await apiClient.submitFeedback(
					introduction_id,
					from_person_id,
					content,
					sentiment
				)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
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
				let result = await apiClient.listFeedback(args.introduction_id)
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(result, null, 2),
						},
					],
				}
			}

			if (name === 'get_feedback') {
				if (!args || typeof args !== 'object' || !('id' in args) || typeof args.id !== 'string') {
					throw new Error('Invalid arguments: id is required and must be a string')
				}
				let result = await apiClient.getFeedback(args.id)
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
