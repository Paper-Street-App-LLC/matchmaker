import { createScorer } from 'evalite'

export type CoreOutput = {
	text: string
	toolCalls: string[]
}

export function mentions(needle: string, { caseInsensitive = true }: { caseInsensitive?: boolean } = {}) {
	return createScorer<unknown, CoreOutput>({
		name: `mentions("${needle}")`,
		description: `Pass if the output text contains "${needle}".`,
		scorer: ({ output }) => {
			let haystack = caseInsensitive ? output.text.toLowerCase() : output.text
			let target = caseInsensitive ? needle.toLowerCase() : needle
			return haystack.includes(target) ? 1 : 0
		},
	})
}

export function doesNotMention(needle: string, { caseInsensitive = true }: { caseInsensitive?: boolean } = {}) {
	return createScorer<unknown, CoreOutput>({
		name: `doesNotMention("${needle}")`,
		description: `Pass if the output text does NOT contain "${needle}".`,
		scorer: ({ output }) => {
			let haystack = caseInsensitive ? output.text.toLowerCase() : output.text
			let target = caseInsensitive ? needle.toLowerCase() : needle
			return haystack.includes(target) ? 0 : 1
		},
	})
}

export let nonEmpty = createScorer<unknown, CoreOutput>({
	name: 'nonEmpty',
	description: 'Pass if the output text has at least one non-whitespace character.',
	scorer: ({ output }) => {
		return output.text.trim().length > 0 ? 1 : 0
	},
})
