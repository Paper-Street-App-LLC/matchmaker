import { describe, test, expect } from 'bun:test'
import { prompts, getPrompt } from '../src/prompts'

describe('Prompts', () => {
	describe('prompts list', () => {
		test('contains only the matchmaker interview prompt', () => {
			expect(prompts).toHaveLength(1)

			let interviewPrompt = prompts[0]
			expect(interviewPrompt).toBeDefined()
			expect(interviewPrompt?.name).toBe('matchmaker_interview')
			expect(interviewPrompt?.description).toBeDefined()
			expect(interviewPrompt?.arguments).toEqual([])
		})

		test('matchmaker_interview has correct metadata', () => {
			let interviewPrompt = prompts.find(p => p.name === 'matchmaker_interview')
			expect(interviewPrompt).toBeDefined()
			expect(interviewPrompt?.name).toBe('matchmaker_interview')
			expect(interviewPrompt?.description).toContain('matchmaker')
		})
	})

	describe('getPrompt', () => {
		test('returns interview messages for matchmaker_interview', () => {
			let result = getPrompt('matchmaker_interview')

			expect(result.messages).toBeDefined()
			expect(result.messages).toHaveLength(1)

			let message = result.messages[0]
			expect(message).toBeDefined()
			expect(message?.role).toBe('user')
			expect(message?.content.type).toBe('text')
			expect(message?.content.text).toBeDefined()
		})

		test('interview covers key phases', () => {
			let result = getPrompt('matchmaker_interview')
			let text = result.messages[0]?.content.text ?? ''

			expect(text).toContain('Phase 1')
			expect(text).toContain('Phase 14')
			expect(text).toContain('Diagnostic Question')
			expect(text).toContain('Deal Breaker')
		})

		test('interview addresses matchmaker context', () => {
			let result = getPrompt('matchmaker_interview')
			let text = result.messages[0]?.content.text ?? ''

			expect(text).toContain('matchmaker')
			expect(text).toContain('advocate')
			expect(text.toLowerCase()).toContain('not the single person')
		})

		test('throws error for unknown prompt name', () => {
			expect(() => getPrompt('unknown_prompt')).toThrow('Unknown prompt: unknown_prompt')
		})

		test('throws error for empty prompt name', () => {
			expect(() => getPrompt('')).toThrow('Unknown prompt: ')
		})
	})
})
