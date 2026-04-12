import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
	createIntroduction,
	IntroductionNotFoundError,
	RepositoryError,
	type IIntroductionRepository,
	type Introduction,
	type IntroductionUpdate,
} from '@matchmaker/shared'
import { translateSupabaseError } from './errors.js'

let introRowSchema = z.object({
	id: z.string().min(1),
	person_a_id: z.string().min(1),
	person_b_id: z.string().min(1),
	matchmaker_a_id: z.string().min(1),
	matchmaker_b_id: z.string().min(1),
	status: z.enum(['pending', 'accepted', 'declined', 'dating', 'ended']),
	notes: z.string().nullable(),
	created_at: z.coerce.date(),
	updated_at: z.coerce.date(),
})

type IntroRow = z.infer<typeof introRowSchema>

let rowToIntroduction = (row: IntroRow): Introduction =>
	createIntroduction({
		id: row.id,
		matchmakerAId: row.matchmaker_a_id,
		matchmakerBId: row.matchmaker_b_id,
		personAId: row.person_a_id,
		personBId: row.person_b_id,
		status: row.status,
		notes: row.notes,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	})

let parseIntroRow = (raw: unknown): Introduction => {
	try {
		return rowToIntroduction(introRowSchema.parse(raw))
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw new RepositoryError('INVALID_ROW', `Invalid introductions row: ${err.message}`)
		}
		throw err
	}
}

let introToInsertRow = (intro: Introduction) => ({
	id: intro.id,
	person_a_id: intro.personAId,
	person_b_id: intro.personBId,
	matchmaker_a_id: intro.matchmakerAId,
	matchmaker_b_id: intro.matchmakerBId,
	status: intro.status,
	notes: intro.notes,
})

let introPatchToRow = (patch: IntroductionUpdate): Record<string, unknown> => {
	let row: Record<string, unknown> = {}
	if (patch.status !== undefined) row.status = patch.status
	if (patch.notes !== undefined) row.notes = patch.notes
	return row
}

export class SupabaseIntroductionRepository implements IIntroductionRepository {
	constructor(private readonly client: SupabaseClient) {}

	async findById(id: string): Promise<Introduction | null> {
		let { data, error } = await this.client
			.from('introductions')
			.select('*')
			.eq('id', id)
			.maybeSingle()
		if (error) throw translateSupabaseError(error)
		if (data === null) return null
		return parseIntroRow(data)
	}

	async findByMatchmaker(matchmakerId: string): Promise<readonly Introduction[]> {
		let { data, error } = await this.client
			.from('introductions')
			.select('*')
			.or(`matchmaker_a_id.eq.${matchmakerId},matchmaker_b_id.eq.${matchmakerId}`)
		if (error) throw translateSupabaseError(error)
		let rows: unknown[] = data ?? []
		return rows.map(parseIntroRow)
	}

	async create(introduction: Introduction): Promise<Introduction> {
		let { data, error } = await this.client
			.from('introductions')
			.insert(introToInsertRow(introduction))
			.select()
			.single()
		if (error) throw translateSupabaseError(error)
		return parseIntroRow(data)
	}

	async update(id: string, patch: IntroductionUpdate): Promise<Introduction> {
		let { data, error } = await this.client
			.from('introductions')
			.update(introPatchToRow(patch))
			.eq('id', id)
			.select()
			.maybeSingle()
		if (error) throw translateSupabaseError(error)
		if (data === null) throw new IntroductionNotFoundError(id)
		return parseIntroRow(data)
	}
}
