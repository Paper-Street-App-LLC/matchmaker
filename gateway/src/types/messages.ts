import { z } from 'zod'

export let inboundMessageSchema = z.object({
	provider: z.string().min(1),
	senderId: z.string().min(1),
	text: z.string().min(1),
	threadId: z.string().min(1),
	timestamp: z.number(),
})

export type InboundMessage = z.infer<typeof inboundMessageSchema>

export let outboundMessageSchema = z.object({
	provider: z.string().min(1),
	senderId: z.string().min(1),
	threadId: z.string().min(1),
	text: z.string().min(1),
})

export type OutboundMessage = z.infer<typeof outboundMessageSchema>
