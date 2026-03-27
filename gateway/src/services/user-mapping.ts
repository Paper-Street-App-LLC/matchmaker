import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export let resolveOrCreate = async (
	supabaseClient: SupabaseClient,
	provider: string,
	senderId: string
): Promise<string> => {
	// Check for existing mapping
	let { data: existing, error: lookupError } = await supabaseClient
		.from('user_provider_mappings')
		.select('user_id')
		.eq('provider', provider)
		.eq('sender_id', senderId)
		.maybeSingle()

	if (lookupError) {
		throw new Error(`Failed to look up user provider mapping: ${lookupError.message}`)
	}

	if (existing) {
		return existing.user_id as string
	}

	// Create a new Supabase auth user
	// The handle_new_user() trigger auto-creates the matchmakers row
	let { data: userData, error: createError } = await supabaseClient.auth.admin.createUser({
		email: `${provider}-${senderId}-${randomUUID()}@gateway.matchmaker.local`,
		email_confirm: true,
		user_metadata: { provider, sender_id: senderId },
	})

	if (createError || !userData.user) {
		throw new Error(`Failed to create user: ${createError?.message ?? 'unknown error'}`)
	}

	let userId = userData.user.id

	// Create the provider mapping
	let { error: insertError } = await supabaseClient
		.from('user_provider_mappings')
		.insert({ user_id: userId, provider, sender_id: senderId })
		.select()
		.single()

	if (insertError) {
		throw new Error(`Failed to create user provider mapping: ${insertError.message}`)
	}

	return userId
}
