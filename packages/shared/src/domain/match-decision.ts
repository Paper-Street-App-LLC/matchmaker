/**
 * MatchDecision domain entity.
 *
 * Records a matchmaker's accept/decline decision for a candidate in
 * relation to a primary person. Has one cross-field rule: declineReason
 * is only meaningful when decision === 'declined'.
 */
import { DomainError } from './errors.js'

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

function invalid(code: string, message: string): never {
	throw new InvalidMatchDecisionError(code, message)
}

function requireNonEmptyString(value: string, field: string, code: string): void {
	if (typeof value !== 'string' || value.trim().length === 0) {
		invalid(code, `${field} must be a non-empty string`)
	}
}

function validateDate(value: Date, field: string, code: string): Date {
	if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
		invalid(code, `${field} must be a valid Date`)
	}
	return value
}

export function createMatchDecision(input: MatchDecisionInput): MatchDecision {
	requireNonEmptyString(input.id, 'id', 'INVALID_MATCH_DECISION_ID')
	requireNonEmptyString(
		input.matchmakerId,
		'matchmakerId',
		'INVALID_MATCH_DECISION_MATCHMAKER_ID',
	)
	requireNonEmptyString(input.personId, 'personId', 'INVALID_MATCH_DECISION_PERSON_ID')
	requireNonEmptyString(
		input.candidateId,
		'candidateId',
		'INVALID_MATCH_DECISION_CANDIDATE_ID',
	)

	if (input.personId === input.candidateId) {
		invalid(
			'INVALID_MATCH_DECISION_SELF',
			'personId and candidateId must refer to different people',
		)
	}

	if (!DECISIONS.includes(input.decision)) {
		invalid(
			'INVALID_MATCH_DECISION_DECISION',
			`decision must be one of ${DECISIONS.join(', ')}`,
		)
	}

	let declineReason: string | null = null
	let rawReason = input.declineReason

	if (input.decision === 'accepted') {
		if (rawReason !== undefined && rawReason !== null) {
			invalid(
				'INVALID_MATCH_DECISION_ACCEPTED_REASON',
				'declineReason must be null when decision is accepted',
			)
		}
	} else if (rawReason !== undefined && rawReason !== null) {
		if (typeof rawReason !== 'string' || rawReason.trim().length === 0) {
			invalid(
				'INVALID_MATCH_DECISION_DECLINE_REASON',
				'declineReason must be a non-empty string when provided',
			)
		}
		declineReason = rawReason
	}

	let createdAt = validateDate(
		input.createdAt,
		'createdAt',
		'INVALID_MATCH_DECISION_CREATED_AT',
	)

	let decision: MatchDecision = {
		id: input.id,
		matchmakerId: input.matchmakerId,
		personId: input.personId,
		candidateId: input.candidateId,
		decision: input.decision,
		declineReason,
		createdAt,
	}

	return Object.freeze(decision)
}
