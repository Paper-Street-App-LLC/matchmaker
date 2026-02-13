import { z } from 'zod'

export let createMatchDecisionSchema = z.object({
	person_id: z.string().uuid(),
	candidate_id: z.string().uuid(),
	decision: z.enum(['accepted', 'declined']),
	decline_reason: z.string().optional(),
})

export let matchDecisionResponseSchema = z.object({
	id: z.string().uuid(),
	matchmaker_id: z.string().uuid(),
	person_id: z.string().uuid(),
	candidate_id: z.string().uuid(),
	decision: z.string(),
	decline_reason: z.string().nullable(),
	created_at: z.string(),
})

export type CreateMatchDecisionInput = z.infer<typeof createMatchDecisionSchema>
export type MatchDecisionResponse = z.infer<typeof matchDecisionResponseSchema>
