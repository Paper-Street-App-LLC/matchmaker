export const INTAKE_QUESTIONNAIRE_NAME = 'intake_questionnaire'

export interface Prompt {
	name: string
	description: string
	arguments: Array<{
		name: string
		description: string
		required?: boolean
	}>
}

export interface PromptMessage {
	role: 'user' | 'assistant'
	content: {
		type: 'text'
		text: string
	}
}

export interface GetPromptResult {
	messages: PromptMessage[]
}

export const prompts: Prompt[] = [
	{
		name: INTAKE_QUESTIONNAIRE_NAME,
		description: 'Standard questions to ask when adding a new single to the matchmaker',
		arguments: [],
	},
]

const INTAKE_QUESTIONNAIRE_TEXT = `Please gather the following information about the new single:

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

export function getPrompt(name: string): GetPromptResult {
	if (name !== INTAKE_QUESTIONNAIRE_NAME) {
		throw new Error(`Unknown prompt: ${name}`)
	}

	return {
		messages: [
			{
				role: 'user',
				content: {
					type: 'text',
					text: INTAKE_QUESTIONNAIRE_TEXT,
				},
			},
		],
	}
}
