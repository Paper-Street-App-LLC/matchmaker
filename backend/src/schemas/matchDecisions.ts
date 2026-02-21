import { z } from 'zod'

export let createDecisionSchema = z.object({
	person_id: z.string().uuid(),
	candidate_id: z.string().uuid(),
	decision: z.enum(['accepted', 'declined']),
	decline_reason: z.string().optional(),
})

export let decisionResponseSchema = z.object({
	id: z.string().uuid(),
	matchmaker_id: z.string().uuid(),
	person_id: z.string().uuid(),
	candidate_id: z.string().uuid(),
	decision: z.enum(['accepted', 'declined']),
	decline_reason: z.string().nullable(),
	created_at: z.string(),
})

export type CreateDecisionInput = z.infer<typeof createDecisionSchema>
export type DecisionResponse = z.infer<typeof decisionResponseSchema>
