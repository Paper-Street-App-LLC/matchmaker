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

function invalid(code: string, message: string): never {
	throw new InvalidPersonError(code, message)
}

function requireNonEmptyString(value: string, field: string, code: string): string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		invalid(code, `${field} must be a non-empty string`)
	}
	return value
}

function validateDate(value: Date, field: string, code: string): Date {
	if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
		invalid(code, `${field} must be a valid Date`)
	}
	return value
}

function freezeRecord(
	value: Record<string, unknown> | null | undefined,
): Readonly<Record<string, unknown>> | null {
	if (value === undefined || value === null) return null
	return Object.freeze({ ...value })
}

export function createPerson(input: PersonInput): Person {
	requireNonEmptyString(input.id, 'id', 'INVALID_PERSON_ID')
	requireNonEmptyString(input.name, 'name', 'INVALID_PERSON_NAME')

	let age: number | null = null
	if (input.age !== undefined && input.age !== null) {
		if (
			typeof input.age !== 'number' ||
			!Number.isFinite(input.age) ||
			!Number.isInteger(input.age) ||
			input.age < 18
		) {
			invalid('INVALID_PERSON_AGE', 'age must be an integer >= 18 when provided')
		}
		age = input.age
	}

	let matchmakerId: string | null = null
	if (input.matchmakerId !== undefined && input.matchmakerId !== null) {
		requireNonEmptyString(
			input.matchmakerId,
			'matchmakerId',
			'INVALID_PERSON_MATCHMAKER_ID',
		)
		matchmakerId = input.matchmakerId
	}

	let createdAt = validateDate(input.createdAt, 'createdAt', 'INVALID_PERSON_CREATED_AT')
	let updatedAt = validateDate(input.updatedAt, 'updatedAt', 'INVALID_PERSON_UPDATED_AT')

	if (updatedAt.getTime() < createdAt.getTime()) {
		invalid('INVALID_PERSON_TIMESTAMPS', 'updatedAt must be >= createdAt')
	}

	let person: Person = {
		id: input.id,
		matchmakerId,
		name: input.name,
		age,
		location: input.location ?? null,
		gender: input.gender ?? null,
		preferences: freezeRecord(input.preferences),
		personality: freezeRecord(input.personality),
		notes: input.notes ?? null,
		active: input.active ?? true,
		createdAt,
		updatedAt,
	}

	return Object.freeze(person)
}
