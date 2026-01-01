import { z } from 'zod'

export let matchResponseSchema = z.object({
	personId: z.string().uuid(),
	score: z.number(),
})

export type MatchResponse = z.infer<typeof matchResponseSchema>
