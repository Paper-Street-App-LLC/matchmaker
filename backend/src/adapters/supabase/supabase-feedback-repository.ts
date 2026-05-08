import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
	createFeedback,
	RepositoryError,
	type Feedback,
	type IFeedbackRepository,
} from '@matchmaker/shared'
import { translateSupabaseError } from './errors.js'

let feedbackRowSchema = z.object({
	id: z.string().min(1),
	introduction_id: z.string().min(1),
	from_person_id: z.string().min(1),
	content: z.string().min(1),
	sentiment: z.string().nullable(),
	created_at: z.coerce.date(),
})

type FeedbackRow = z.infer<typeof feedbackRowSchema>

let rowToFeedback = (row: FeedbackRow): Feedback =>
	createFeedback({
		id: row.id,
		introductionId: row.introduction_id,
		fromPersonId: row.from_person_id,
		content: row.content,
		sentiment: row.sentiment,
		createdAt: row.created_at,
	})

let parseFeedbackRow = (raw: unknown): Feedback => {
	try {
		return rowToFeedback(feedbackRowSchema.parse(raw))
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw new RepositoryError('INVALID_ROW', `Invalid feedback row: ${err.message}`)
		}
		throw err
	}
}

let feedbackToInsertRow = (f: Feedback) => ({
	id: f.id,
	introduction_id: f.introductionId,
	from_person_id: f.fromPersonId,
	content: f.content,
	sentiment: f.sentiment,
})

export class SupabaseFeedbackRepository implements IFeedbackRepository {
	constructor(private readonly client: SupabaseClient) {}

	async findById(id: string): Promise<Feedback | null> {
		let { data, error } = await this.client
			.from('feedback')
			.select('*')
			.eq('id', id)
			.maybeSingle()
		if (error) throw translateSupabaseError(error)
		if (data === null) return null
		return parseFeedbackRow(data)
	}

	async findByIntroductionId(introductionId: string): Promise<readonly Feedback[]> {
		let { data, error } = await this.client
			.from('feedback')
			.select('*')
			.eq('introduction_id', introductionId)
		if (error) throw translateSupabaseError(error)
		let rows: unknown[] = data ?? []
		return rows.map(parseFeedbackRow)
	}

	async create(feedback: Feedback): Promise<Feedback> {
		let { data, error } = await this.client
			.from('feedback')
			.insert(feedbackToInsertRow(feedback))
			.select()
			.single()
		if (error) throw translateSupabaseError(error)
		return parseFeedbackRow(data)
	}
}
