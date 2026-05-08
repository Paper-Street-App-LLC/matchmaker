/** Feedback domain entity — a person's reaction to an introduction they were part of. */
import { DomainError } from './errors.js'
import { requireNonEmptyString, assertValidDate } from './validators.js'

export class InvalidFeedbackError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'InvalidFeedbackError'
	}
}

export interface Feedback {
	readonly id: string
	readonly introductionId: string
	readonly fromPersonId: string
	readonly content: string
	readonly sentiment: string | null
	readonly createdAt: Date
}

export interface FeedbackInput {
	readonly id: string
	readonly introductionId: string
	readonly fromPersonId: string
	readonly content: string
	readonly sentiment?: string | null
	readonly createdAt: Date
}

export function createFeedback(input: FeedbackInput): Feedback {
	let id = requireNonEmptyString(input.id, 'id', 'INVALID_FEEDBACK_ID', InvalidFeedbackError)
	let introductionId = requireNonEmptyString(
		input.introductionId,
		'introductionId',
		'INVALID_FEEDBACK_INTRODUCTION_ID',
		InvalidFeedbackError,
	)
	let fromPersonId = requireNonEmptyString(
		input.fromPersonId,
		'fromPersonId',
		'INVALID_FEEDBACK_FROM_PERSON_ID',
		InvalidFeedbackError,
	)
	let content = requireNonEmptyString(
		input.content,
		'content',
		'INVALID_FEEDBACK_CONTENT',
		InvalidFeedbackError,
	)

	// Empty/whitespace sentiment normalizes to null. Adapters often coerce
	// missing form fields to '' — treat that as "absent" rather than invalid.
	let rawSentiment = input.sentiment
	let sentiment =
		typeof rawSentiment === 'string' && rawSentiment.trim().length > 0
			? rawSentiment.trim()
			: null

	assertValidDate(
		input.createdAt,
		'createdAt',
		'INVALID_FEEDBACK_CREATED_AT',
		InvalidFeedbackError,
	)

	let feedback: Feedback = {
		id,
		introductionId,
		fromPersonId,
		content,
		sentiment,
		createdAt: input.createdAt,
	}

	return Object.freeze(feedback)
}
