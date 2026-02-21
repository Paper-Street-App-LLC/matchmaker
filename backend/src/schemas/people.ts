import { z } from 'zod'

export let createPersonSchema = z.object({
	name: z.string().min(1),
	age: z.number().int().positive().optional(),
	location: z.string().optional(),
	gender: z.string().optional(),
	preferences: z.record(z.unknown()).optional(),
	personality: z.record(z.unknown()).optional(),
	notes: z.string().optional(),
})

export let updatePersonSchema = z.object({
	name: z.string().min(1).optional(),
	age: z.number().int().positive().optional(),
	location: z.string().optional(),
	gender: z.string().optional(),
	preferences: z.record(z.unknown()).optional(),
	personality: z.record(z.unknown()).optional(),
	notes: z.string().optional(),
})

export let personResponseSchema = z.object({
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

export type CreatePersonInput = z.infer<typeof createPersonSchema>
export type PersonResponse = z.infer<typeof personResponseSchema>
