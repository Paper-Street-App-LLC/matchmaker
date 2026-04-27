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
import type { IApiClient } from './api.js'
import { createToolHandlers, isValidToolName } from './handlers.js'
import { prompts, getPrompt, buildMcpToolList } from '@matchmaker/shared'

export let listAdvertisedTools = () => buildMcpToolList()

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
			},
		}
	)

	// Register tools — single source of truth is @matchmaker/shared.
	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: listAdvertisedTools(),
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
