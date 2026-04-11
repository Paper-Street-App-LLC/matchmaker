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

export function createIntroduction(_input: IntroductionInput): Introduction {
	throw new Error('Not implemented')
}
