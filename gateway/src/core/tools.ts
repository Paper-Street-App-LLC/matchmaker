import { tool, type Tool, type ToolSet } from 'ai'
import { toolRegistry } from '@matchmaker/shared'
import type { McpToolCaller } from './mcp-client'

export function createMatchmakerTools(caller: McpToolCaller): ToolSet {
	let tools: Record<string, Tool> = {}

	for (let def of toolRegistry) {
		tools[def.name] = tool({
			description: def.description,
			inputSchema: def.inputSchema,
			execute: async (args: unknown) => {
				return await caller.call(def.name, (args ?? {}) as Record<string, unknown>)
			},
		})
	}

	return tools
}
