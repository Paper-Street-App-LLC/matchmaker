import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { save as defaultSave, getHistory as defaultGetHistory } from '../store/conversations'
import { executeTool as defaultExecuteTool } from '../tools/executor'
import { toolDefinitions } from '../tools/definitions'
import { MATCHMAKER_INTERVIEW_TEXT } from './system-prompt'

let MAX_TOOL_STEPS = 10

export type MessageCreateFn = (
	params: Anthropic.MessageCreateParamsNonStreaming
) => Promise<Anthropic.Message>

export type Deps = {
	createMessage?: MessageCreateFn
	save?: typeof defaultSave
	getHistory?: typeof defaultGetHistory
	executeTool?: typeof defaultExecuteTool
}

type ProcessMessageParams = {
	text: string
	threadId: string
	userId: string
	supabaseClient: SupabaseClient
	deps?: Deps
}

let createDefaultMessage: MessageCreateFn = async params => {
	let anthropic = new Anthropic()
	return anthropic.messages.create(params)
}

export let processMessage = async (params: ProcessMessageParams): Promise<string> => {
	let { text, threadId, userId, supabaseClient, deps = {} } = params
	let createMessage = deps.createMessage ?? createDefaultMessage
	let save = deps.save ?? defaultSave
	let getHistory = deps.getHistory ?? defaultGetHistory
	let executeTool = deps.executeTool ?? defaultExecuteTool

	// Load conversation history
	let history = await getHistory(supabaseClient, threadId, 50)

	// Build messages array from history
	let messages: Anthropic.MessageParam[] = history.map(msg => ({
		role: msg.role as 'user' | 'assistant',
		content: msg.content as string | Anthropic.ContentBlockParam[],
	}))

	// Add the new user message
	messages.push({ role: 'user', content: text })

	// Tool-calling loop
	let response: Anthropic.Message
	let steps = 0

	while (steps < MAX_TOOL_STEPS) {
		steps++

		response = await createMessage({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 4096,
			system: MATCHMAKER_INTERVIEW_TEXT,
			tools: toolDefinitions,
			messages,
		})

		// If no tool calls, we're done
		if (response.stop_reason !== 'tool_use') {
			break
		}

		// Execute tool calls
		let toolUseBlocks = response.content.filter(
			(block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
		)

		// Add assistant message with tool_use blocks
		messages.push({ role: 'assistant', content: response.content })

		// Execute each tool and add results
		let toolResults: Anthropic.ToolResultBlockParam[] = []
		for (let toolUse of toolUseBlocks) {
			let result = await executeTool(
				supabaseClient,
				userId,
				toolUse.name,
				(toolUse.input as Record<string, unknown>) ?? {}
			)
			toolResults.push({
				type: 'tool_result',
				tool_use_id: toolUse.id,
				content: result.content,
				is_error: result.isError,
			})
		}

		messages.push({ role: 'user', content: toolResults })
	}

	// Extract text from final response
	let responseText = response!.content
		.filter((block): block is Anthropic.TextBlock => block.type === 'text')
		.map(block => block.text)
		.join('\n')

	// Save user message and assistant response to conversation store
	await save(supabaseClient, { threadId, role: 'user', content: text })
	await save(supabaseClient, { threadId, role: 'assistant', content: responseText })

	return responseText
}
