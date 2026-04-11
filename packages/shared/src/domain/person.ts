/** Person domain entity — framework-free representation of a person tracked by a matchmaker. */
import { DomainError } from './errors.js'
import { requireNonEmptyString, assertValidDate } from './validators.js'

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

function freezeRecord(
	value: Record<string, unknown> | null | undefined,
): Readonly<Record<string, unknown>> | null {
	if (value === undefined || value === null) return null
	return Object.freeze({ ...value })
}

export function createPerson(input: PersonInput): Person {
	let id = requireNonEmptyString(input.id, 'id', 'INVALID_PERSON_ID', InvalidPersonError)
	let name = requireNonEmptyString(input.name, 'name', 'INVALID_PERSON_NAME', InvalidPersonError)

	let age: number | null = null
	if (input.age !== undefined && input.age !== null) {
		if (
			typeof input.age !== 'number' ||
			!Number.isFinite(input.age) ||
			!Number.isInteger(input.age) ||
			input.age < 18
		) {
			throw new InvalidPersonError(
				'INVALID_PERSON_AGE',
				'age must be an integer >= 18 when provided',
			)
		}
		age = input.age
	}

	let matchmakerId: string | null = null
	if (input.matchmakerId !== undefined && input.matchmakerId !== null) {
		matchmakerId = requireNonEmptyString(
			input.matchmakerId,
			'matchmakerId',
			'INVALID_PERSON_MATCHMAKER_ID',
			InvalidPersonError,
		)
	}

	assertValidDate(input.createdAt, 'createdAt', 'INVALID_PERSON_CREATED_AT', InvalidPersonError)
	assertValidDate(input.updatedAt, 'updatedAt', 'INVALID_PERSON_UPDATED_AT', InvalidPersonError)

	if (input.updatedAt.getTime() < input.createdAt.getTime()) {
		throw new InvalidPersonError('INVALID_PERSON_TIMESTAMPS', 'updatedAt must be >= createdAt')
	}

	let person: Person = {
		id,
		matchmakerId,
		name,
		age,
		location: input.location ?? null,
		gender: input.gender ?? null,
		preferences: freezeRecord(input.preferences),
		personality: freezeRecord(input.personality),
		notes: input.notes ?? null,
		active: input.active ?? true,
		createdAt: input.createdAt,
		updatedAt: input.updatedAt,
	}

	return Object.freeze(person)
}
