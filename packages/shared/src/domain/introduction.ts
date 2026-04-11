/** Introduction domain entity — links two people across matchmakers and tracks match lifecycle. */
import { DomainError } from './errors.js'
import { requireNonEmptyString, assertValidDate } from './validators.js'

export class InvalidIntroductionError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'InvalidIntroductionError'
	}
}

export type IntroductionStatus = 'pending' | 'accepted' | 'declined' | 'dating' | 'ended'

export interface Introduction {
	readonly id: string
	readonly matchmakerAId: string
	readonly matchmakerBId: string
	readonly personAId: string
	readonly personBId: string
	readonly status: IntroductionStatus
	readonly notes: string | null
	readonly createdAt: Date
	readonly updatedAt: Date
}

export interface IntroductionInput {
	readonly id: string
	readonly matchmakerAId: string
	readonly matchmakerBId: string
	readonly personAId: string
	readonly personBId: string
	readonly status?: IntroductionStatus
	readonly notes?: string | null
	readonly createdAt: Date
	readonly updatedAt: Date
}

const STATUSES: readonly IntroductionStatus[] = [
	'pending',
	'accepted',
	'declined',
	'dating',
	'ended',
]

export function createIntroduction(input: IntroductionInput): Introduction {
	const id = requireNonEmptyString(
		input.id,
		'id',
		'INVALID_INTRODUCTION_ID',
		InvalidIntroductionError,
	)
	// matchmakerAId === matchmakerBId is intentionally allowed: a single matchmaker may
	// introduce two of their own people without involving a second matchmaker.
	const matchmakerAId = requireNonEmptyString(
		input.matchmakerAId,
		'matchmakerAId',
		'INVALID_INTRODUCTION_MATCHMAKER_A_ID',
		InvalidIntroductionError,
	)
	const matchmakerBId = requireNonEmptyString(
		input.matchmakerBId,
		'matchmakerBId',
		'INVALID_INTRODUCTION_MATCHMAKER_B_ID',
		InvalidIntroductionError,
	)
	const personAId = requireNonEmptyString(
		input.personAId,
		'personAId',
		'INVALID_INTRODUCTION_PERSON_A_ID',
		InvalidIntroductionError,
	)
	const personBId = requireNonEmptyString(
		input.personBId,
		'personBId',
		'INVALID_INTRODUCTION_PERSON_B_ID',
		InvalidIntroductionError,
	)

	if (personAId === personBId) {
		throw new InvalidIntroductionError(
			'INVALID_INTRODUCTION_SELF',
			'personAId and personBId must refer to different people',
		)
	}

	const status: IntroductionStatus = input.status ?? 'pending'
	if (!STATUSES.includes(status)) {
		throw new InvalidIntroductionError(
			'INVALID_INTRODUCTION_STATUS',
			`status must be one of ${STATUSES.join(', ')}`,
		)
	}

	assertValidDate(
		input.createdAt,
		'createdAt',
		'INVALID_INTRODUCTION_CREATED_AT',
		InvalidIntroductionError,
	)
	assertValidDate(
		input.updatedAt,
		'updatedAt',
		'INVALID_INTRODUCTION_UPDATED_AT',
		InvalidIntroductionError,
	)

	if (input.updatedAt.getTime() < input.createdAt.getTime()) {
		throw new InvalidIntroductionError(
			'INVALID_INTRODUCTION_TIMESTAMPS',
			'updatedAt must be >= createdAt',
		)
	}

	const introduction: Introduction = {
		id,
		matchmakerAId,
		matchmakerBId,
		personAId,
		personBId,
		status,
		notes: input.notes ?? null,
		createdAt: input.createdAt,
		updatedAt: input.updatedAt,
	}

	return Object.freeze(introduction)
}
