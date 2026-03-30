import { z } from 'zod'

export let InboundMessageSchema = z.object({
	provider: z.string().min(1),
	senderId: z.string().min(1),
	userId: z.string().uuid(),
	text: z.string().min(1),
	threadId: z.string().min(1),
	timestamp: z.number().int().positive(),
})

export type InboundMessage = z.infer<typeof InboundMessageSchema>

export let OutboundMessageSchema = z.object({
	provider: z.string().min(1),
	senderId: z.string().min(1),
	threadId: z.string().min(1),
	text: z.string().min(1),
})

export type OutboundMessage = z.infer<typeof OutboundMessageSchema>
