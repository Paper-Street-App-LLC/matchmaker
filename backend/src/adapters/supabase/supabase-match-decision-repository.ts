import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
	createMatchDecision,
	type IMatchDecisionRepository,
	type MatchDecision,
} from '@matchmaker/shared'
import { translateSupabaseError } from './errors.js'

let decisionRowSchema = z.object({
	id: z.string().min(1),
	matchmaker_id: z.string().min(1),
	person_id: z.string().min(1),
	candidate_id: z.string().min(1),
	decision: z.enum(['accepted', 'declined']),
	decline_reason: z.string().nullable(),
	created_at: z.coerce.date(),
})

type DecisionRow = z.infer<typeof decisionRowSchema>

let rowToDecision = (row: DecisionRow): MatchDecision =>
	createMatchDecision({
		id: row.id,
		matchmakerId: row.matchmaker_id,
		personId: row.person_id,
		candidateId: row.candidate_id,
		decision: row.decision,
		declineReason: row.decline_reason,
		createdAt: row.created_at,
	})

let parseDecisionRow = (raw: unknown): MatchDecision =>
	rowToDecision(decisionRowSchema.parse(raw))

let decisionToInsertRow = (d: MatchDecision) => ({
	id: d.id,
	matchmaker_id: d.matchmakerId,
	person_id: d.personId,
	candidate_id: d.candidateId,
	decision: d.decision,
	decline_reason: d.declineReason,
})

export class SupabaseMatchDecisionRepository implements IMatchDecisionRepository {
	constructor(private readonly client: SupabaseClient) {}

	async findByPerson(personId: string): Promise<readonly MatchDecision[]> {
		let { data, error } = await this.client
			.from('match_decisions')
			.select('*')
			.eq('person_id', personId)
		if (error) throw translateSupabaseError(error)
		let rows: unknown[] = data ?? []
		return rows.map(parseDecisionRow)
	}

	async findByCandidatePair(
		personId: string,
		candidateId: string,
	): Promise<MatchDecision | null> {
		let { data, error } = await this.client
			.from('match_decisions')
			.select('*')
			.eq('person_id', personId)
			.eq('candidate_id', candidateId)
			.maybeSingle()
		if (error) throw translateSupabaseError(error)
		if (data === null) return null
		return parseDecisionRow(data)
	}

	async create(decision: MatchDecision): Promise<MatchDecision> {
		let { data, error } = await this.client
			.from('match_decisions')
			.insert(decisionToInsertRow(decision))
			.select()
			.single()
		if (error) throw translateSupabaseError(error)
		return parseDecisionRow(data)
	}
}
