/**
 * Introduction domain entity.
 *
 * Links two people across (possibly distinct) matchmakers and tracks the
 * lifecycle status of the match. Framework-free; the adapter layer maps
 * DB rows and Zod shapes into this type.
 */
import { DomainError } from './errors.js'

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

function invalid(code: string, message: string): never {
	throw new InvalidIntroductionError(code, message)
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

export function createIntroduction(input: IntroductionInput): Introduction {
	requireNonEmptyString(input.id, 'id', 'INVALID_INTRODUCTION_ID')
	requireNonEmptyString(
		input.matchmakerAId,
		'matchmakerAId',
		'INVALID_INTRODUCTION_MATCHMAKER_A_ID',
	)
	requireNonEmptyString(
		input.matchmakerBId,
		'matchmakerBId',
		'INVALID_INTRODUCTION_MATCHMAKER_B_ID',
	)
	requireNonEmptyString(input.personAId, 'personAId', 'INVALID_INTRODUCTION_PERSON_A_ID')
	requireNonEmptyString(input.personBId, 'personBId', 'INVALID_INTRODUCTION_PERSON_B_ID')

	if (input.personAId === input.personBId) {
		invalid(
			'INVALID_INTRODUCTION_SELF',
			'personAId and personBId must refer to different people',
		)
	}

	let status: IntroductionStatus = input.status ?? 'pending'
	if (!STATUSES.includes(status)) {
		invalid(
			'INVALID_INTRODUCTION_STATUS',
			`status must be one of ${STATUSES.join(', ')}`,
		)
	}

	let createdAt = validateDate(
		input.createdAt,
		'createdAt',
		'INVALID_INTRODUCTION_CREATED_AT',
	)
	let updatedAt = validateDate(
		input.updatedAt,
		'updatedAt',
		'INVALID_INTRODUCTION_UPDATED_AT',
	)

	if (updatedAt.getTime() < createdAt.getTime()) {
		invalid('INVALID_INTRODUCTION_TIMESTAMPS', 'updatedAt must be >= createdAt')
	}

	let introduction: Introduction = {
		id: input.id,
		matchmakerAId: input.matchmakerAId,
		matchmakerBId: input.matchmakerBId,
		personAId: input.personAId,
		personBId: input.personBId,
		status,
		notes: input.notes ?? null,
		createdAt,
		updatedAt,
	}

	return Object.freeze(introduction)
}
