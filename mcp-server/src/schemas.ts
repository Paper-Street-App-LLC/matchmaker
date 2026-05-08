import { z } from 'zod'

export const personResponseSchema = z.looseObject({
	id: z.string().uuid(),
	matchmaker_id: z.string().uuid(),
	name: z.string(),
	age: z.number().nullable(),
	location: z.string().nullable(),
	gender: z.string().nullable(),
	preferences: z.record(z.string(), z.unknown()).nullable(),
	personality: z.record(z.string(), z.unknown()).nullable(),
	notes: z.string().nullable(),
	active: z.boolean(),
	created_at: z.string(),
	updated_at: z.string(),
})

export const peopleListResponseSchema = z.array(personResponseSchema)

export const introductionResponseSchema = z.looseObject({
	id: z.string().uuid(),
	matchmaker_id: z.string().uuid(),
	person_a_id: z.string().uuid(),
	person_b_id: z.string().uuid(),
	status: z.string(),
	notes: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
})

export const introductionsListResponseSchema = z.array(introductionResponseSchema)

// Match schema - currently placeholder, will be expanded when algorithm is implemented
export const matchResponseSchema = z.looseObject({
	person: z
		.looseObject({
			id: z.string().uuid(),
			name: z.string(),
			age: z.number().nullable().optional(),
			location: z.string().nullable().optional(),
		})
		.optional(),
	compatibility_score: z.number().optional(),
	match_reasons: z.array(z.string()).optional(),
})

export const matchesListResponseSchema = z.array(matchResponseSchema)

// Feedback schema
export const feedbackResponseSchema = z.looseObject({
	id: z.string().uuid(),
	introduction_id: z.string().uuid(),
	from_person_id: z.string().uuid(),
	content: z.string(),
	sentiment: z.string().nullable(),
	created_at: z.string(),
})

export const feedbackListResponseSchema = z.array(feedbackResponseSchema)

// Match decision schema
export const matchDecisionResponseSchema = z.looseObject({
	id: z.string().uuid(),
	matchmaker_id: z.string().uuid(),
	person_id: z.string().uuid(),
	candidate_id: z.string().uuid(),
	decision: z.enum(['accepted', 'declined']),
	decline_reason: z.string().nullable(),
	created_at: z.string(),
})

export const matchDecisionsListResponseSchema = z.array(matchDecisionResponseSchema)
