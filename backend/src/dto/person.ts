import type { Person, PersonUpdate } from '@matchmaker/shared'
import type {
	CreatePersonInput,
	UpdatePersonInput,
} from '../usecases/index'

export type PersonResponseDTO = {
	readonly id: string
	readonly matchmaker_id: string | null
	readonly name: string
	readonly age: number | null
	readonly location: string | null
	readonly gender: string | null
	readonly preferences: Readonly<Record<string, unknown>> | null
	readonly personality: Readonly<Record<string, unknown>> | null
	readonly notes: string | null
	readonly active: boolean
	readonly created_at: string
	readonly updated_at: string
}

export let toPersonResponseDTO = (person: Person): PersonResponseDTO => ({
	id: person.id,
	matchmaker_id: person.matchmakerId,
	name: person.name,
	age: person.age,
	location: person.location,
	gender: person.gender,
	preferences: person.preferences,
	personality: person.personality,
	notes: person.notes,
	active: person.active,
	created_at: person.createdAt.toISOString(),
	updated_at: person.updatedAt.toISOString(),
})

export type CreatePersonRequestBody = {
	name: string
	age?: number
	location?: string
	gender?: string
	preferences?: Record<string, unknown>
	personality?: Record<string, unknown>
	notes?: string
}

export let fromCreatePersonRequestDTO = (
	body: CreatePersonRequestBody,
	matchmakerId: string,
): CreatePersonInput => ({
	matchmakerId,
	name: body.name,
	age: body.age,
	location: body.location,
	gender: body.gender,
	preferences: body.preferences,
	personality: body.personality,
	notes: body.notes,
})

export type UpdatePersonRequestBody = {
	name?: string
	age?: number
	location?: string
	gender?: string
	preferences?: Record<string, unknown>
	personality?: Record<string, unknown>
	notes?: string
}

export let fromUpdatePersonRequestDTO = (
	body: UpdatePersonRequestBody,
	matchmakerId: string,
	personId: string,
): UpdatePersonInput => {
	let patch: PersonUpdate = {}
	if ('name' in body && body.name !== undefined) patch.name = body.name
	if ('age' in body && body.age !== undefined) patch.age = body.age
	if ('location' in body && body.location !== undefined) patch.location = body.location
	if ('gender' in body && body.gender !== undefined) patch.gender = body.gender
	if ('preferences' in body && body.preferences !== undefined)
		patch.preferences = body.preferences
	if ('personality' in body && body.personality !== undefined)
		patch.personality = body.personality
	if ('notes' in body && body.notes !== undefined) patch.notes = body.notes
	return { matchmakerId, personId, patch }
}
