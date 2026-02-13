import { z } from 'zod'

export let createIntroductionSchema = z.object({
	person_a_id: z.string().uuid(),
	person_b_id: z.string().uuid(),
	notes: z.string().optional(),
})

export let updateIntroductionSchema = z.object({
	status: z.enum(['pending', 'accepted', 'declined', 'dating', 'ended']).optional(),
	notes: z.string().optional(),
})

export let introductionResponseSchema = z.object({
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

export type CreateIntroductionInput = z.infer<typeof createIntroductionSchema>
export type UpdateIntroductionInput = z.infer<typeof updateIntroductionSchema>
export type IntroductionResponse = z.infer<typeof introductionResponseSchema>
