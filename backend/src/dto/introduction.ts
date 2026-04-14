import type { Introduction, IntroductionStatus } from '@matchmaker/shared'
import type {
	CreateIntroductionInput,
	UpdateIntroductionStatusInput,
} from '../usecases/index'

export type IntroductionResponseDTO = {
	readonly id: string
	readonly matchmaker_a_id: string
	readonly matchmaker_b_id: string
	readonly person_a_id: string
	readonly person_b_id: string
	readonly status: string
	readonly notes: string | null
	readonly created_at: string
	readonly updated_at: string
}

export let toIntroductionResponseDTO = (
	intro: Introduction,
): IntroductionResponseDTO => ({
	id: intro.id,
	matchmaker_a_id: intro.matchmakerAId,
	matchmaker_b_id: intro.matchmakerBId,
	person_a_id: intro.personAId,
	person_b_id: intro.personBId,
	status: intro.status,
	notes: intro.notes,
	created_at: intro.createdAt.toISOString(),
	updated_at: intro.updatedAt.toISOString(),
})

export type CreateIntroductionRequestBody = {
	person_a_id: string
	person_b_id: string
	notes?: string
}

export let fromCreateIntroductionRequestDTO = (
	body: CreateIntroductionRequestBody,
	matchmakerId: string,
): CreateIntroductionInput => ({
	matchmakerId,
	personAId: body.person_a_id,
	personBId: body.person_b_id,
	notes: body.notes,
})

export type UpdateIntroductionRequestBody = {
	status?: IntroductionStatus
	notes?: string
}

export let fromUpdateIntroductionRequestDTO = (
	body: UpdateIntroductionRequestBody,
	matchmakerId: string,
	introductionId: string,
): UpdateIntroductionStatusInput => {
	let result: UpdateIntroductionStatusInput = { matchmakerId, introductionId }
	if (body.status !== undefined) result.status = body.status
	if (body.notes !== undefined) result.notes = body.notes
	return result
}
