import {
	InvalidFeedbackError,
	createFeedback,
	type Feedback,
	type IFeedbackRepository,
} from '@matchmaker/shared'
import type { Clock, IdGenerator, UseCase, UseCaseResult } from './types'

export type SubmitFeedbackInput = {
	introductionId: string
	fromPersonId: string
	content: string
	sentiment?: string | null
}

export type SubmitFeedbackDeps = {
	feedbackRepo: IFeedbackRepository
	clock: Clock
	ids: IdGenerator
}

export class SubmitFeedback implements UseCase<SubmitFeedbackInput, Feedback> {
	constructor(private deps: SubmitFeedbackDeps) {}

	async execute(input: SubmitFeedbackInput): Promise<UseCaseResult<Feedback>> {
		let feedback: Feedback
		try {
			feedback = createFeedback({
				id: this.deps.ids.newId(),
				introductionId: input.introductionId,
				fromPersonId: input.fromPersonId,
				content: input.content,
				sentiment: input.sentiment ?? null,
				createdAt: this.deps.clock.now(),
			})
		} catch (error) {
			if (error instanceof InvalidFeedbackError) {
				return { ok: false, error: { code: 'unprocessable', message: error.message } }
			}
			throw error
		}

		let saved = await this.deps.feedbackRepo.create(feedback)
		return { ok: true, data: saved }
	}
}
