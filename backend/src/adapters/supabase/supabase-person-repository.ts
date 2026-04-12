import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
	createPerson,
	PersonNotFoundError,
	RepositoryError,
	type IPersonRepository,
	type Person,
	type PersonUpdate,
} from '@matchmaker/shared'
import { translateSupabaseError } from './errors.js'

let personRowSchema = z.object({
	id: z.string().min(1),
	matchmaker_id: z.string().min(1).nullable(),
	name: z.string().min(1),
	age: z.number().int().nullable(),
	location: z.string().nullable(),
	gender: z.string().nullable(),
	preferences: z.record(z.string(), z.unknown()).nullable(),
	personality: z.record(z.string(), z.unknown()).nullable(),
	notes: z.string().nullable(),
	active: z.boolean(),
	created_at: z.coerce.date(),
	updated_at: z.coerce.date(),
})

type PersonRow = z.infer<typeof personRowSchema>

let rowToPerson = (row: PersonRow): Person =>
	createPerson({
		id: row.id,
		matchmakerId: row.matchmaker_id,
		name: row.name,
		age: row.age,
		location: row.location,
		gender: row.gender,
		preferences: row.preferences,
		personality: row.personality,
		notes: row.notes,
		active: row.active,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	})

let parsePersonRow = (raw: unknown): Person => {
	try {
		return rowToPerson(personRowSchema.parse(raw))
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw new RepositoryError('INVALID_ROW', `Invalid people row: ${err.message}`)
		}
		throw err
	}
}

let personToInsertRow = (person: Person) => ({
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
})

let personPatchToRow = (patch: PersonUpdate): Record<string, unknown> => {
	let row: Record<string, unknown> = {}
	if (patch.name !== undefined) row.name = patch.name
	if (patch.age !== undefined) row.age = patch.age
	if (patch.location !== undefined) row.location = patch.location
	if (patch.gender !== undefined) row.gender = patch.gender
	if (patch.preferences !== undefined) row.preferences = patch.preferences
	if (patch.personality !== undefined) row.personality = patch.personality
	if (patch.notes !== undefined) row.notes = patch.notes
	if (patch.active !== undefined) row.active = patch.active
	return row
}

export class SupabasePersonRepository implements IPersonRepository {
	constructor(private readonly client: SupabaseClient) {}

	async findById(id: string): Promise<Person | null> {
		let { data, error } = await this.client
			.from('people')
			.select('*')
			.eq('id', id)
			.maybeSingle()
		if (error) throw translateSupabaseError(error)
		if (data === null) return null
		return parsePersonRow(data)
	}

	async findByMatchmakerId(matchmakerId: string): Promise<readonly Person[]> {
		let { data, error } = await this.client
			.from('people')
			.select('*')
			.eq('matchmaker_id', matchmakerId)
		if (error) throw translateSupabaseError(error)
		let rows: unknown[] = data ?? []
		return rows.map(parsePersonRow)
	}

	async findAllActive(): Promise<readonly Person[]> {
		let { data, error } = await this.client
			.from('people')
			.select('*')
			.eq('active', true)
		if (error) throw translateSupabaseError(error)
		let rows: unknown[] = data ?? []
		return rows.map(parsePersonRow)
	}

	async create(person: Person): Promise<Person> {
		let { data, error } = await this.client
			.from('people')
			.insert(personToInsertRow(person))
			.select()
			.single()
		if (error) throw translateSupabaseError(error)
		return parsePersonRow(data)
	}

	async update(id: string, patch: PersonUpdate): Promise<Person> {
		let { data, error } = await this.client
			.from('people')
			.update(personPatchToRow(patch))
			.eq('id', id)
			.select()
			.maybeSingle()
		if (error) throw translateSupabaseError(error)
		if (data === null) throw new PersonNotFoundError(id)
		return parsePersonRow(data)
	}

	/**
	 * TODO: Soft-deletes via `update({ active: false })` to preserve the
	 * behavior of the pre-adapter route handler. Follow-up issue should revisit
	 * whether `IPersonRepository.delete` should be hard or soft.
	 */
	async delete(id: string): Promise<void> {
		let { data, error } = await this.client
			.from('people')
			.update({ active: false })
			.eq('id', id)
			.select()
			.maybeSingle()
		if (error) throw translateSupabaseError(error)
		if (data === null) throw new PersonNotFoundError(id)
	}
}
