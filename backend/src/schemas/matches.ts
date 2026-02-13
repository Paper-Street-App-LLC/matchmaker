import { z } from 'zod'

export let limitedPersonSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	age: z.number().nullable(),
	location: z.string().nullable(),
	gender: z.string().nullable(),
	is_seed: z.boolean(),
})

export let matchResponseSchema = z.object({
	person: limitedPersonSchema,
	compatibility_score: z.number(),
	match_explanation: z.string(),
	is_cross_matchmaker: z.boolean(),
})

export type LimitedPerson = z.infer<typeof limitedPersonSchema>
export type MatchResponse = z.infer<typeof matchResponseSchema>
