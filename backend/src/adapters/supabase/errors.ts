import type { PostgrestError } from '@supabase/supabase-js'
import { RepositoryConflictError, RepositoryError } from '@matchmaker/shared'

export let translateSupabaseError = (error: PostgrestError): RepositoryError => {
	if (error.code === '23505') {
		return new RepositoryConflictError(error.message)
	}
	return new RepositoryError('REPOSITORY_ERROR', error.message)
}
