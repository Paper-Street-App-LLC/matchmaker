import { describe, test, expect } from 'bun:test'
import { prompts, getPrompt, MATCHMAKER_INTERVIEW_TEXT } from '../src/index'

describe('@matchmaker/shared barrel exports', () => {
	test('exports prompts array', () => {
		expect(Array.isArray(prompts)).toBe(true)
	})

	test('exports getPrompt function', () => {
		expect(typeof getPrompt).toBe('function')
	})

	test('exports MATCHMAKER_INTERVIEW_TEXT string', () => {
		expect(typeof MATCHMAKER_INTERVIEW_TEXT).toBe('string')
		expect(MATCHMAKER_INTERVIEW_TEXT.length).toBeGreaterThan(0)
	})
})
