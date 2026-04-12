import type { PostgrestError } from '@supabase/supabase-js'
import { RepositoryConflictError, RepositoryError } from '@matchmaker/shared'

export let translateSupabaseError = (error: PostgrestError): RepositoryError => {
	if (error.code === '23505') {
		return new RepositoryConflictError(error.message)
	}
	return new RepositoryError('REPOSITORY_ERROR', error.message)
}

/**
 * Validates that a value is safe to interpolate into a PostgREST filter
 * string. Rejects anything that is not strictly alphanumeric + hyphens
 * (i.e. UUID-shaped). This prevents injection via `.or()` filter strings
 * where supabase-js does not escape values.
 */
let SAFE_ID = /^[0-9a-fA-F-]+$/

export let assertSafeFilterValue = (value: string, label: string): void => {
	if (!SAFE_ID.test(value)) {
		throw new RepositoryError(
			'INVALID_ARGUMENT',
			`${label} contains characters unsafe for PostgREST filter interpolation`,
		)
	}
}
