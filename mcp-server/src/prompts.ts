import type { GetPromptResult, PromptMessage } from '@modelcontextprotocol/sdk/types.js'
import { MATCHMAKER_INTERVIEW_PROMPT } from './matchmaker-interview-prompt.js'

export type { GetPromptResult, PromptMessage }

export const INTAKE_QUESTIONNAIRE_NAME = 'intake_questionnaire'
export const MATCHMAKER_INTERVIEW_NAME = 'matchmaker_interview'

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
		name: INTAKE_QUESTIONNAIRE_NAME,
		description: 'Standard questions to ask when adding a new single to the matchmaker',
		arguments: [],
	},
	{
		name: MATCHMAKER_INTERVIEW_NAME,
		description: '14-phase interview methodology for matchmakers advocating on behalf of singles',
		arguments: [],
	},
]

export const INTAKE_QUESTIONNAIRE_TEXT = `Please gather the following information about the new single:

## Basics
1. **Name**: What is your full name?
2. **Age**: How old are you?
3. **Location**: Where do you live (city/area)?
4. **Gender**: Are you a man or a woman?

## Preferences
5. **Age Range**: What age range are you looking for in a partner?
6. **Preferred Locations**: Are you open to matches from other locations, or do you prefer someone nearby?

## Personality & Interests
7. **Personality Traits**: How would you describe yourself in 3-5 words?
8. **Interests & Hobbies**: What do you enjoy doing in your free time?
9. **Values**: What's most important to you in a relationship?

## Additional Notes
10. **Anything else**: Is there anything else you'd like us to know about you or what you're looking for?`

let promptTexts: Record<string, string> = {
	[INTAKE_QUESTIONNAIRE_NAME]: INTAKE_QUESTIONNAIRE_TEXT,
	[MATCHMAKER_INTERVIEW_NAME]: MATCHMAKER_INTERVIEW_PROMPT,
}

export function getPrompt(name: string): GetPromptResult {
	let text = promptTexts[name]

	if (!text) {
		throw new Error(`Unknown prompt: ${name}`)
	}

	return {
		messages: [
			{
				role: 'user',
				content: {
					type: 'text',
					text,
				},
			},
		],
	}
}
