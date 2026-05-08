import { describe, test, expect } from 'bun:test'
import { SubmitFeedback } from '../../src/usecases/submit-feedback'
import { InMemoryFeedbackRepository } from '../fakes/in-memory-repositories'
import { FIXED_NOW, assertErr, assertOk, fixedClock, fixedIds } from './fixtures'

let buildDeps = () => {
	let feedbackRepo = new InMemoryFeedbackRepository()
	return {
		feedbackRepo,
		deps: {
			feedbackRepo,
			clock: fixedClock(),
			ids: fixedIds(['generated-feedback']),
		},
	}
}

describe('SubmitFeedback use case', () => {
	test('persists a Feedback with sentiment', async () => {
		// Arrange
		let { deps, feedbackRepo } = buildDeps()
		let usecase = new SubmitFeedback(deps)

		// Act
		let result = await usecase.execute({
			introductionId: 'intro-1',
			fromPersonId: 'person-1',
			content: 'They got along well.',
			sentiment: 'positive',
		})

		// Assert
		assertOk(result)
		expect(result.data.id).toBe('generated-feedback')
		expect(result.data.introductionId).toBe('intro-1')
		expect(result.data.fromPersonId).toBe('person-1')
		expect(result.data.content).toBe('They got along well.')
		expect(result.data.sentiment).toBe('positive')
		expect(result.data.createdAt.getTime()).toBe(FIXED_NOW.getTime())
		let stored = await feedbackRepo.findById('generated-feedback')
		expect(stored?.id).toBe('generated-feedback')
	})

	test('persists a Feedback when sentiment is omitted', async () => {
		let { deps } = buildDeps()
		let usecase = new SubmitFeedback(deps)

		let result = await usecase.execute({
			introductionId: 'intro-1',
			fromPersonId: 'person-1',
			content: 'No comment on chemistry.',
		})

		assertOk(result)
		expect(result.data.sentiment).toBeNull()
	})

	test('returns unprocessable when content is empty', async () => {
		let { deps } = buildDeps()
		let usecase = new SubmitFeedback(deps)

		let result = await usecase.execute({
			introductionId: 'intro-1',
			fromPersonId: 'person-1',
			content: '',
		})

		assertErr(result)
		expect(result.error.code).toBe('unprocessable')
	})

	test('returns unprocessable when introductionId is empty', async () => {
		let { deps } = buildDeps()
		let usecase = new SubmitFeedback(deps)

		let result = await usecase.execute({
			introductionId: '',
			fromPersonId: 'person-1',
			content: 'They got along well.',
		})

		assertErr(result)
		expect(result.error.code).toBe('unprocessable')
	})
})
