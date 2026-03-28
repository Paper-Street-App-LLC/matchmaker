// TODO: Move prompts module here
import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js'

export type { GetPromptResult, PromptMessage }

export interface Prompt {
	name: string
	description: string
	arguments: Array<{
		name: string
		description: string
		required?: boolean
	}>
}

export const prompts: Prompt[] = []

export function getPrompt(_name: string): GetPromptResult {
	throw new Error('Not implemented')
}
