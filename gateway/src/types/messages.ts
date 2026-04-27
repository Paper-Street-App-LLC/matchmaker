import { z } from 'zod'

export let RawInboundMessageSchema = z.object({
	provider: z.string().min(1),
	senderId: z.string().min(1),
	text: z.string().min(1),
	threadId: z.string().min(1),
	timestamp: z.number().int().positive(),
})

export type RawInboundMessage = z.infer<typeof RawInboundMessageSchema>

export let InboundMessageSchema = RawInboundMessageSchema.extend({
	userId: z.string().uuid(),
})

export type InboundMessage = z.infer<typeof InboundMessageSchema>

export let OutboundMessageSchema = z.object({
	provider: z.string().min(1),
	senderId: z.string().min(1),
	threadId: z.string().min(1),
	text: z.string().min(1),
})

export type OutboundMessage = z.infer<typeof OutboundMessageSchema>
