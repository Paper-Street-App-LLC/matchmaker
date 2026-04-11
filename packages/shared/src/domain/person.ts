/**
 * Person domain entity.
 *
 * Framework-free representation of a person tracked by a matchmaker.
 * Snake_case DB columns map to camelCase here; ISO timestamp strings
 * map to `Date`. Adapter layer owns the mapping — this module speaks
 * only in domain types.
 *
 * `preferences` stays typed as `Record<string, unknown> | null` in this
 * issue. A later issue in the Clean Architecture epic will tighten it
 * to the `Preferences` value object once existing rows are audited.
 */
import { DomainError } from './errors.js'

export class InvalidPersonError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'InvalidPersonError'
	}
}

export interface Person {
	readonly id: string
	readonly matchmakerId: string | null
	readonly name: string
	readonly age: number | null
	readonly location: string | null
	readonly gender: string | null
	readonly preferences: Readonly<Record<string, unknown>> | null
	readonly personality: Readonly<Record<string, unknown>> | null
	readonly notes: string | null
	readonly active: boolean
	readonly createdAt: Date
	readonly updatedAt: Date
}

export interface PersonInput {
	readonly id: string
	readonly matchmakerId?: string | null
	readonly name: string
	readonly age?: number | null
	readonly location?: string | null
	readonly gender?: string | null
	readonly preferences?: Record<string, unknown> | null
	readonly personality?: Record<string, unknown> | null
	readonly notes?: string | null
	readonly active?: boolean
	readonly createdAt: Date
	readonly updatedAt: Date
}

export function createPerson(_input: PersonInput): Person {
	throw new Error('Not implemented')
}
