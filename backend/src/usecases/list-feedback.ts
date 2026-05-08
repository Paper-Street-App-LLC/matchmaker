import type { Feedback, IFeedbackRepository } from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type ListFeedbackInput = {
	introductionId: string
}

export type ListFeedbackDeps = {
	feedbackRepo: IFeedbackRepository
}

export class ListFeedback implements UseCase<ListFeedbackInput, readonly Feedback[]> {
	constructor(private deps: ListFeedbackDeps) {}

	async execute(input: ListFeedbackInput): Promise<UseCaseResult<readonly Feedback[]>> {
		let items = await this.deps.feedbackRepo.findByIntroductionId(input.introductionId)
		return { ok: true, data: items }
	}
}
