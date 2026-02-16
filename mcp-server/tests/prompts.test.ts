import { describe, test, expect } from 'bun:test'
import { prompts, getPrompt, INTAKE_QUESTIONNAIRE_NAME, MATCHMAKER_INTERVIEW_NAME } from '../src/prompts'

describe('Prompts', () => {
	describe('prompts list', () => {
		test('returns intake_questionnaire prompt', () => {
			let intakePrompt = prompts.find(p => p.name === INTAKE_QUESTIONNAIRE_NAME)
			expect(intakePrompt).toBeDefined()
			expect(intakePrompt?.name).toBe('intake_questionnaire')
			expect(intakePrompt?.description).toBeDefined()
			expect(intakePrompt?.arguments).toEqual([])
		})

		test('intake_questionnaire has correct metadata', () => {
			let intakePrompt = prompts.find(p => p.name === INTAKE_QUESTIONNAIRE_NAME)
			expect(intakePrompt).toBeDefined()
			expect(intakePrompt?.name).toBe('intake_questionnaire')
			expect(intakePrompt?.description).toContain('new single')
		})

		test('returns matchmaker_interview prompt', () => {
			let interviewPrompt = prompts.find(p => p.name === MATCHMAKER_INTERVIEW_NAME)
			expect(interviewPrompt).toBeDefined()
			expect(interviewPrompt?.name).toBe('matchmaker_interview')
			expect(interviewPrompt?.description).toBeDefined()
			expect(interviewPrompt?.arguments).toEqual([])
		})

		test('contains both prompts', () => {
			expect(prompts).toHaveLength(2)
		})
	})

	describe('getPrompt', () => {
		test('returns questionnaire messages for intake_questionnaire', () => {
			let result = getPrompt('intake_questionnaire')

			expect(result.messages).toBeDefined()
			expect(result.messages).toHaveLength(1)

			let message = result.messages[0]
			expect(message).toBeDefined()
			expect(message?.role).toBe('user')
			expect(message?.content.type).toBe('text')
			expect(message?.content.text).toBeDefined()

			// Verify questionnaire content covers key areas
			let text = message?.content.text ?? ''
			expect(text).toContain('Name')
			expect(text).toContain('Age')
			expect(text).toContain('Location')
			expect(text).toContain('Gender')
		})

		test('questionnaire covers preferences', () => {
			let result = getPrompt('intake_questionnaire')
			let text = result.messages[0]?.content.text ?? ''

			expect(text.toLowerCase()).toContain('prefer')
		})

		test('questionnaire covers personality/interests', () => {
			let result = getPrompt('intake_questionnaire')
			let text = result.messages[0]?.content.text ?? ''

			// Should ask about personality traits or interests
			expect(text.toLowerCase()).toMatch(/personality|traits|interests|hobbies/)
		})

		test('throws error for unknown prompt name', () => {
			expect(() => getPrompt('unknown_prompt')).toThrow('Unknown prompt: unknown_prompt')
		})

		test('throws error for empty prompt name', () => {
			expect(() => getPrompt('')).toThrow('Unknown prompt: ')
		})
	})

	describe('getPrompt - matchmaker_interview', () => {
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
	})
})
