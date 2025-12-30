import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
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
		],
	}))

	// Handle tool calls
	server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

// Only run server if this file is executed directly
if (import.meta.main) {
	let config = await loadConfig()
	let apiClient = new ApiClient(config)
	let server = createServer(apiClient)
	let transport = new StdioServerTransport()
	await server.connect(transport)
}
