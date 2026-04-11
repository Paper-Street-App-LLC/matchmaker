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

export function createMatchDecision(_input: MatchDecisionInput): MatchDecision {
	throw new Error('Not implemented')
}
