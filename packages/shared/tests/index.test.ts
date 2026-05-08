import { describe, test, expect } from 'bun:test'
import {
	prompts,
	getPrompt,
	MATCHMAKER_INTERVIEW_TEXT,
	createPreferences,
	createPerson,
	createIntroduction,
	createMatchDecision,
	createFeedback,
	DomainError,
	InvalidPreferencesError,
	InvalidPersonError,
	InvalidIntroductionError,
	InvalidMatchDecisionError,
	InvalidFeedbackError,
	AuthorizationService,
	AuthorizationError,
} from '../src/index'

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

describe('domain barrel', () => {
	test('re-exports createPreferences, createPerson, createIntroduction, createMatchDecision, createFeedback as functions', () => {
		expect(typeof createPreferences).toBe('function')
		expect(typeof createPerson).toBe('function')
		expect(typeof createIntroduction).toBe('function')
		expect(typeof createMatchDecision).toBe('function')
		expect(typeof createFeedback).toBe('function')
	})

	test('re-exports DomainError and all Invalid*Error classes', () => {
		expect(typeof DomainError).toBe('function')
		expect(typeof InvalidPreferencesError).toBe('function')
		expect(typeof InvalidPersonError).toBe('function')
		expect(typeof InvalidIntroductionError).toBe('function')
		expect(typeof InvalidMatchDecisionError).toBe('function')
		expect(typeof InvalidFeedbackError).toBe('function')
	})

	test('re-exports AuthorizationService and AuthorizationError', () => {
		expect(typeof AuthorizationService).toBe('object')
		expect(typeof AuthorizationService.canMatchmakerAccessPerson).toBe('function')
		expect(typeof AuthorizationError).toBe('function')
	})
})
