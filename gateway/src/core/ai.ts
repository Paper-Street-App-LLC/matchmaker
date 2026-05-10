import { anthropic } from '@ai-sdk/anthropic'
import { generateText, stepCountIs, type LanguageModel, type ModelMessage, type ToolSet } from 'ai'
import { MATCHMAKER_INTERVIEW_TEXT } from '@matchmaker/shared'
import type { ConversationMessage, NewConversationMessage } from '../store/conversations'
import type { InboundMessage } from '../types/messages'

export interface ConversationStore {
	getHistory(threadId: string, limit: number): Promise<ConversationMessage[]>
	save(message: NewConversationMessage): Promise<void>
}

export type GenerateTextFn = typeof generateText

export type ProcessMessageDeps = {
	store: ConversationStore
	tools: ToolSet
	generateText?: GenerateTextFn
	model?: LanguageModel
	systemPrompt?: string
	historyLimit?: number
	maxSteps?: number
}

export type ProcessMessageInput = {
	inbound: InboundMessage
	systemPromptSuffix?: string
}

let DEFAULT_HISTORY_LIMIT = 50
let DEFAULT_MAX_STEPS = 10
let DEFAULT_MODEL_ID = 'claude-sonnet-4-6'

export async function processMessage(
	input: ProcessMessageInput,
	deps: ProcessMessageDeps,
): Promise<string> {
	let { inbound } = input
	let runGenerate = deps.generateText ?? generateText
	let model = deps.model ?? anthropic(DEFAULT_MODEL_ID)
	let baseSystemPrompt = deps.systemPrompt ?? MATCHMAKER_INTERVIEW_TEXT
	let systemPrompt = input.systemPromptSuffix
		? `${baseSystemPrompt}\n\n${input.systemPromptSuffix}`
		: baseSystemPrompt
	let historyLimit = deps.historyLimit ?? DEFAULT_HISTORY_LIMIT
	let maxSteps = deps.maxSteps ?? DEFAULT_MAX_STEPS

	let history = await deps.store.getHistory(inbound.threadId, historyLimit)
	let priorMessages = toModelMessages(history)

	let messages: ModelMessage[] = [
		...priorMessages,
		{ role: 'user', content: inbound.text },
	]

	let result = await runGenerate({
		model,
		system: systemPrompt,
		messages,
		tools: deps.tools,
		stopWhen: stepCountIs(maxSteps),
	})

	await deps.store.save({
		threadId: inbound.threadId,
		role: 'user',
		content: inbound.text,
		provider: inbound.provider,
		senderId: inbound.senderId,
	})
	await deps.store.save({
		threadId: inbound.threadId,
		role: 'assistant',
		content: result.text,
	})

	return result.text
}

function toModelMessages(history: ConversationMessage[]): ModelMessage[] {
	let messages: ModelMessage[] = []
	for (let row of history) {
		if (row.role === 'user') {
			messages.push({ role: 'user', content: row.content })
		} else if (row.role === 'assistant') {
			messages.push({ role: 'assistant', content: row.content })
		}
	}
	return messages
}
