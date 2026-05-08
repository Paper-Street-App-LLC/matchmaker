import type { Feedback } from '@matchmaker/shared'
import type { SubmitFeedbackInput } from '../usecases/index'

export type FeedbackResponseDTO = {
	readonly id: string
	readonly introduction_id: string
	readonly from_person_id: string
	readonly content: string
	readonly sentiment: string | null
	readonly created_at: string
}

export let toFeedbackResponseDTO = (feedback: Feedback): FeedbackResponseDTO => ({
	id: feedback.id,
	introduction_id: feedback.introductionId,
	from_person_id: feedback.fromPersonId,
	content: feedback.content,
	sentiment: feedback.sentiment,
	created_at: feedback.createdAt.toISOString(),
})

export type CreateFeedbackRequestBody = {
	introduction_id: string
	from_person_id: string
	content: string
	sentiment?: string
}

export let fromCreateFeedbackRequestDTO = (
	body: CreateFeedbackRequestBody,
): SubmitFeedbackInput => ({
	introductionId: body.introduction_id,
	fromPersonId: body.from_person_id,
	content: body.content,
	sentiment: body.sentiment,
})
