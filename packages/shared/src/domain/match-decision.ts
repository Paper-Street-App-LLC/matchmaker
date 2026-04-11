/** MatchDecision domain entity — records a matchmaker's accept/decline decision for a candidate. */
import { DomainError } from './errors.js'
import { requireNonEmptyString, assertValidDate } from './validators.js'

export class InvalidMatchDecisionError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'InvalidMatchDecisionError'
	}
}

export type Decision = 'accepted' | 'declined'

export interface MatchDecision {
	readonly id: string
	readonly matchmakerId: string
	readonly personId: string
	readonly candidateId: string
	readonly decision: Decision
	readonly declineReason: string | null
	readonly createdAt: Date
}

export interface MatchDecisionInput {
	readonly id: string
	readonly matchmakerId: string
	readonly personId: string
	readonly candidateId: string
	readonly decision: Decision
	readonly declineReason?: string | null
	readonly createdAt: Date
}

const DECISIONS: readonly Decision[] = ['accepted', 'declined']

export function createMatchDecision(input: MatchDecisionInput): MatchDecision {
	const id = requireNonEmptyString(
		input.id,
		'id',
		'INVALID_MATCH_DECISION_ID',
		InvalidMatchDecisionError,
	)
	const matchmakerId = requireNonEmptyString(
		input.matchmakerId,
		'matchmakerId',
		'INVALID_MATCH_DECISION_MATCHMAKER_ID',
		InvalidMatchDecisionError,
	)
	const personId = requireNonEmptyString(
		input.personId,
		'personId',
		'INVALID_MATCH_DECISION_PERSON_ID',
		InvalidMatchDecisionError,
	)
	const candidateId = requireNonEmptyString(
		input.candidateId,
		'candidateId',
		'INVALID_MATCH_DECISION_CANDIDATE_ID',
		InvalidMatchDecisionError,
	)

	if (personId === candidateId) {
		throw new InvalidMatchDecisionError(
			'INVALID_MATCH_DECISION_SELF',
			'personId and candidateId must refer to different people',
		)
	}

	if (!DECISIONS.includes(input.decision)) {
		throw new InvalidMatchDecisionError(
			'INVALID_MATCH_DECISION_DECISION',
			`decision must be one of ${DECISIONS.join(', ')}`,
		)
	}

	let declineReason: string | null = null
	const rawReason = input.declineReason

	if (input.decision === 'accepted') {
		if (rawReason !== undefined && rawReason !== null) {
			throw new InvalidMatchDecisionError(
				'INVALID_MATCH_DECISION_ACCEPTED_REASON',
				'declineReason must be null when decision is accepted',
			)
		}
	} else if (rawReason !== undefined && rawReason !== null) {
		if (typeof rawReason !== 'string' || rawReason.trim().length === 0) {
			throw new InvalidMatchDecisionError(
				'INVALID_MATCH_DECISION_DECLINE_REASON',
				'declineReason must be a non-empty string when provided',
			)
		}
		declineReason = rawReason
	}

	assertValidDate(
		input.createdAt,
		'createdAt',
		'INVALID_MATCH_DECISION_CREATED_AT',
		InvalidMatchDecisionError,
	)

	const decision: MatchDecision = {
		id,
		matchmakerId,
		personId,
		candidateId,
		decision: input.decision,
		declineReason,
		createdAt: input.createdAt,
	}

	return Object.freeze(decision)
}
