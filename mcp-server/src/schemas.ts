import { z } from 'zod'

export const personResponseSchema = z
	.object({
		id: z.string().uuid(),
		matchmaker_id: z.string().uuid().nullable(),
		name: z.string(),
		age: z.number().nullable(),
		location: z.string().nullable(),
		gender: z.string().nullable(),
		preferences: z.record(z.unknown()).nullable(),
		personality: z.record(z.unknown()).nullable(),
		notes: z.string().nullable(),
		active: z.boolean(),
		created_at: z.string(),
		updated_at: z.string(),
	})
	.passthrough()

export const peopleListResponseSchema = z.array(personResponseSchema)

export const introductionResponseSchema = z
	.object({
		id: z.string().uuid(),
		matchmaker_a_id: z.string().uuid(),
		matchmaker_b_id: z.string().uuid(),
		person_a_id: z.string().uuid(),
		person_b_id: z.string().uuid(),
		status: z.string(),
		notes: z.string().nullable(),
		created_at: z.string(),
		updated_at: z.string(),
	})
	.passthrough()

export const introductionsListResponseSchema = z.array(introductionResponseSchema)

export const matchResponseSchema = z
	.object({
		person: z.object({
			id: z.string().uuid(),
			name: z.string(),
			age: z.number().nullable(),
			location: z.string().nullable(),
			gender: z.string().nullable(),
			is_seed: z.boolean(),
		}),
		compatibility_score: z.number(),
		match_explanation: z.string(),
		is_cross_matchmaker: z.boolean(),
	})
	.passthrough()

export const matchesListResponseSchema = z.array(matchResponseSchema)

// Feedback schema
export const feedbackResponseSchema = z
	.object({
		id: z.string().uuid(),
		introduction_id: z.string().uuid(),
		from_person_id: z.string().uuid(),
		content: z.string(),
		sentiment: z.string().nullable(),
		created_at: z.string(),
	})
	.passthrough()

export const feedbackListResponseSchema = z.array(feedbackResponseSchema)
