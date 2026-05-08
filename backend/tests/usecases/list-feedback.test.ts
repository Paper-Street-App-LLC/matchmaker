import { describe, test, expect } from 'bun:test'
import { ListFeedback } from '../../src/usecases/list-feedback'
import { InMemoryFeedbackRepository } from '../fakes/in-memory-repositories'
import { assertOk, makeFeedback } from './fixtures'

describe('ListFeedback use case', () => {
	test('returns all feedback for the introduction', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository([
			makeFeedback({ id: 'fb-1', introductionId: 'intro-1' }),
			makeFeedback({ id: 'fb-2', introductionId: 'intro-1' }),
			makeFeedback({ id: 'fb-3', introductionId: 'intro-other' }),
		])
		let usecase = new ListFeedback({ feedbackRepo })

		let result = await usecase.execute({ introductionId: 'intro-1' })

		assertOk(result)
		expect(result.data.map(f => f.id)).toEqual(['fb-1', 'fb-2'])
	})

	test('returns empty list when introduction has no feedback', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository([])
		let usecase = new ListFeedback({ feedbackRepo })

		let result = await usecase.execute({ introductionId: 'intro-empty' })

		assertOk(result)
		expect(result.data).toEqual([])
	})
})
