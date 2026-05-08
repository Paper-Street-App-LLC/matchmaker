import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { DuplicateMappingError, type UserMappingDb } from '../services/user-mapping'

export let dbRowSchema = z.object({
	provider: z.string(),
	sender_id: z.string(),
	user_id: z.string(),
	created_at: z.string(),
})

export type DbRow = z.infer<typeof dbRowSchema>

const POSTGRES_UNIQUE_VIOLATION = '23505'

export function createSupabaseUserMappingDb(
	client: SupabaseClient,
	table = 'user_provider_mappings',
): UserMappingDb {
	return {
		async findUserId(provider, senderId) {
			let { data, error } = await client
				.from(table)
				.select('user_id')
				.eq('provider', provider)
				.eq('sender_id', senderId)
				.maybeSingle()
			if (error) throw new Error(error.message)
			return (data as { user_id: string } | null)?.user_id ?? null
		},

		async createUser(seed) {
			let { data, error } = await client.auth.admin.createUser({
				user_metadata: { provider: seed.provider, sender_id: seed.senderId },
			})
			if (error) throw new Error(error.message)
			let user = data?.user
			if (!user) throw new Error('Supabase auth.admin.createUser returned no user')
			return user.id
		},

		async insertMapping(provider, senderId, userId) {
			let { error } = await client.from(table).insert({
				provider,
				sender_id: senderId,
				user_id: userId,
			})
			if (!error) return

			let code = (error as { code?: string }).code
			if (code === POSTGRES_UNIQUE_VIOLATION) {
				throw new DuplicateMappingError(provider, senderId)
			}
			throw new Error(error.message)
		},
	}
}
