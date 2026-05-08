import type { Feedback, IFeedbackRepository } from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type GetFeedbackInput = {
	feedbackId: string
}

export type GetFeedbackDeps = {
	feedbackRepo: IFeedbackRepository
}

export class GetFeedback implements UseCase<GetFeedbackInput, Feedback> {
	constructor(private deps: GetFeedbackDeps) {}

	async execute(input: GetFeedbackInput): Promise<UseCaseResult<Feedback>> {
		let existing = await this.deps.feedbackRepo.findById(input.feedbackId)
		if (!existing) {
			return {
				ok: false,
				error: {
					code: 'not_found',
					entity: 'feedback',
					message: `Feedback ${input.feedbackId} not found`,
				},
			}
		}
		return { ok: true, data: existing }
	}
}
