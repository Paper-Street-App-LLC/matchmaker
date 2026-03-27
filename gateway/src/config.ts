import { z } from 'zod'

export let configSchema = z.object({
	SUPABASE_URL: z.url(),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
	ANTHROPIC_API_KEY: z.string().min(1),
	PORT: z.coerce.number().default(3001),
})

export type Config = z.infer<typeof configSchema>
