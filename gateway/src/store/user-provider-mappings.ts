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

const userIdRowSchema = dbRowSchema.pick({ user_id: true })

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
			if (error) throw new Error(error.message, { cause: error })
			if (data === null) return null
			return userIdRowSchema.parse(data).user_id
		},

		async createUser(seed) {
			let { data, error } = await client.auth.admin.createUser({
				user_metadata: { provider: seed.provider, sender_id: seed.senderId },
			})
			if (error) throw new Error(error.message, { cause: error })
			let user = data?.user
			if (!user) throw new Error('Supabase auth.admin.createUser returned no user')
			return user.id
		},

		async deleteUser(userId) {
			let { error } = await client.auth.admin.deleteUser(userId)
			if (error) throw new Error(error.message, { cause: error })
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
			throw new Error(error.message, { cause: error })
		},
	}
}
