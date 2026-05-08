import { describe, test, expect } from 'bun:test'
import { GetFeedback } from '../../src/usecases/get-feedback'
import { InMemoryFeedbackRepository } from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makeFeedback } from './fixtures'

describe('GetFeedback use case', () => {
	test('returns the feedback when it exists', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository([
			makeFeedback({ id: 'fb-1' }),
		])
		let usecase = new GetFeedback({ feedbackRepo })

		let result = await usecase.execute({ feedbackId: 'fb-1' })

		assertOk(result)
		expect(result.data.id).toBe('fb-1')
	})

	test('returns not_found when no row matches the id', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository([])
		let usecase = new GetFeedback({ feedbackRepo })

		let result = await usecase.execute({ feedbackId: 'fb-missing' })

		assertErr(result)
		expect(result.error.code).toBe('not_found')
		if (result.error.code === 'not_found') {
			expect(result.error.entity).toBe('feedback')
		}
	})
})
