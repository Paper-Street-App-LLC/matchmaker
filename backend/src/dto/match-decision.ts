import type { Decision, MatchDecision } from '@matchmaker/shared'
import type { RecordMatchDecisionInput } from '../usecases/index'

export type MatchDecisionResponseDTO = {
	readonly id: string
	readonly matchmaker_id: string
	readonly person_id: string
	readonly candidate_id: string
	readonly decision: Decision
	readonly decline_reason: string | null
	readonly created_at: string
}

export let toMatchDecisionResponseDTO = (
	decision: MatchDecision,
): MatchDecisionResponseDTO => ({
	id: decision.id,
	matchmaker_id: decision.matchmakerId,
	person_id: decision.personId,
	candidate_id: decision.candidateId,
	decision: decision.decision,
	decline_reason: decision.declineReason,
	created_at: decision.createdAt.toISOString(),
})

export type CreateDecisionRequestBody = {
	person_id: string
	candidate_id: string
	decision: Decision
	decline_reason?: string
}

export let fromCreateDecisionRequestDTO = (
	body: CreateDecisionRequestBody,
	matchmakerId: string,
): RecordMatchDecisionInput => ({
	matchmakerId,
	personId: body.person_id,
	candidateId: body.candidate_id,
	decision: body.decision,
	declineReason: body.decline_reason,
})
