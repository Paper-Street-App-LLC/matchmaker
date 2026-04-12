import { describe, test, expect } from 'bun:test'
import {
	RepositoryConflictError,
	RepositoryError,
} from '@matchmaker/shared'
import { translateSupabaseError } from '../../../src/adapters/supabase/errors'

describe('translateSupabaseError', () => {
	test('maps Postgres 23505 (unique violation) to RepositoryConflictError', () => {
		let result = translateSupabaseError({
			code: '23505',
			message: 'duplicate key value violates unique constraint',
			details: '',
			hint: '',
			name: 'PostgrestError',
		})

		expect(result).toBeInstanceOf(RepositoryConflictError)
		expect(result.code).toBe('REPOSITORY_CONFLICT')
		expect(result.message).toContain('duplicate key')
	})

	test('maps unknown error codes to generic RepositoryError', () => {
		let result = translateSupabaseError({
			code: 'XX000',
			message: 'database exploded',
			details: '',
			hint: '',
			name: 'PostgrestError',
		})

		expect(result).toBeInstanceOf(RepositoryError)
		expect(result).not.toBeInstanceOf(RepositoryConflictError)
		expect(result.code).toBe('REPOSITORY_ERROR')
		expect(result.message).toBe('database exploded')
	})
})
