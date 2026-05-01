import { createScorer } from 'evalite'
import type { CoreOutput } from './mentions'

export function toolCalled(name: string) {
	return createScorer<unknown, CoreOutput>({
		name: `toolCalled("${name}")`,
		description: `Pass if the AI core invoked the "${name}" tool at least once.`,
		scorer: ({ output }) => {
			return output.toolCalls.includes(name) ? 1 : 0
		},
	})
}
