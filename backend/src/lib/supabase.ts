import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

let configSchema = z.object({
	url: z.string().url().min(1),
	serviceRoleKey: z.string().min(1),
})

export let createSupabaseClient = (config: {
	url: string
	serviceRoleKey: string
}): SupabaseClient => {
	let validated = configSchema.parse(config)

	return createClient(validated.url, validated.serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	})
}

export type { SupabaseClient }
