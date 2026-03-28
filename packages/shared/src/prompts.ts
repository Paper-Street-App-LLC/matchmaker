import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js'
import { MATCHMAKER_INTERVIEW_TEXT } from './matchmaker-interview-prompt.js'

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

export const prompts: Prompt[] = [
	{
		name: 'matchmaker_interview',
		description: '14-phase interview methodology for matchmakers advocating on behalf of singles',
		arguments: [],
	},
]

export function getPrompt(name: string): GetPromptResult {
	const prompt = prompts.find(p => p.name === name)
	if (!prompt) {
		throw new Error(`Unknown prompt: ${name}`)
	}

	return {
		messages: [
			{
				role: 'user',
				content: {
					type: 'text',
					text: MATCHMAKER_INTERVIEW_TEXT,
				},
			},
		],
	}
}
