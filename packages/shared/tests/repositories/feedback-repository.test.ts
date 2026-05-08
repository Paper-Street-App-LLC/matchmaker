import { describe, test, expect } from 'bun:test'
import type { IFeedbackRepository } from '../../src/repositories/feedback-repository'
import { createFeedback, type Feedback } from '../../src/domain/feedback'

function buildFeedback(overrides: Partial<{ id: string; introductionId: string }> = {}): Feedback {
	return createFeedback({
		id: overrides.id ?? 'feedback-1',
		introductionId: overrides.introductionId ?? 'intro-1',
		fromPersonId: 'person-1',
		content: 'They got along well.',
		sentiment: 'positive',
		createdAt: new Date('2026-01-01T00:00:00Z'),
	})
}

function makeStub(): IFeedbackRepository {
	let store: Feedback[] = []
	return {
		async create(feedback) {
			store.push(feedback)
			return feedback
		},
		async findById(id) {
			return store.find(f => f.id === id) ?? null
		},
		async findByIntroductionId(introductionId) {
			return store.filter(f => f.introductionId === introductionId)
		},
	}
}

describe('IFeedbackRepository (contract)', () => {
	test('a stub conforming to the interface compiles and runs', async () => {
		let repo = makeStub()
		let feedback = buildFeedback()

		let created = await repo.create(feedback)
		expect(created.id).toBe('feedback-1')

		let byId = await repo.findById('feedback-1')
		expect(byId?.id).toBe('feedback-1')

		let missing = await repo.findById('nope')
		expect(missing).toBeNull()

		let byIntroduction = await repo.findByIntroductionId('intro-1')
		expect(byIntroduction.length).toBe(1)

		let none = await repo.findByIntroductionId('intro-other')
		expect(none.length).toBe(0)
	})

	test('findByIntroductionId returns readonly Feedback array', async () => {
		let repo = makeStub()
		await repo.create(buildFeedback())
		let list: readonly Feedback[] = await repo.findByIntroductionId('intro-1')
		expect(list.length).toBe(1)
	})
})
