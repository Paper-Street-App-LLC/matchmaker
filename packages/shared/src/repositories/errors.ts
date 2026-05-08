/** Repository-layer error types — thrown by persistence ports defined in this directory. */
import { DomainError } from '../domain/errors.js'

export class RepositoryError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'RepositoryError'
	}
}

export class PersonNotFoundError extends RepositoryError {
	constructor(id: string) {
		super('PERSON_NOT_FOUND', `Person not found: ${id}`)
		this.name = 'PersonNotFoundError'
	}
}

export class IntroductionNotFoundError extends RepositoryError {
	constructor(id: string) {
		super('INTRODUCTION_NOT_FOUND', `Introduction not found: ${id}`)
		this.name = 'IntroductionNotFoundError'
	}
}

export class MatchDecisionNotFoundError extends RepositoryError {
	constructor(id: string) {
		super('MATCH_DECISION_NOT_FOUND', `Match decision not found: ${id}`)
		this.name = 'MatchDecisionNotFoundError'
	}
}

export class FeedbackNotFoundError extends RepositoryError {
	constructor(id: string) {
		super('FEEDBACK_NOT_FOUND', `Feedback not found: ${id}`)
		this.name = 'FeedbackNotFoundError'
	}
}

export class RepositoryConflictError extends RepositoryError {
	constructor(message: string) {
		super('REPOSITORY_CONFLICT', message)
		this.name = 'RepositoryConflictError'
	}
}
