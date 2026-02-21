import { mock } from 'bun:test'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock session type that mirrors the essential Supabase Session structure
export type MockSession = {
	user: { id: string; email: string }
	access_token: string
	refresh_token: string
}

// Mock query result types for type-safe query builder returns
export type MockQueryResult<T = unknown> = {
	data: T
	error: { message: string } | null
}

export type MockSingleResult<T = unknown> = {
	data: T | null
	error: { message: string } | null
}

export let VALID_TABLES = new Set(['people', 'introductions', 'feedback'])

// Allow tests to provide partial mock implementations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockOverrides = {
	auth?: {
		getUser?: (_token: string) => Promise<{
			data: { user: { id: string } | null }
			error: { message: string } | null
		}>
		signInWithPassword?: (credentials: { email: string; password: string }) => Promise<{
			data: { user: { id: string; email: string } | null; session: MockSession | null }
			error: { message: string } | null
		}>
		signUp?: (credentials: { email: string; password: string }) => Promise<{
			data: { user: { id: string; email: string } | null; session: MockSession | null }
			error: { message: string } | null
		}>
		refreshSession?: (_params: { refresh_token: string }) => Promise<{
			data: { user: { id: string; email: string } | null; session: MockSession | null }
			error: { message: string } | null
		}>
	}
	// Use any for from override since test mocks provide varying partial structures
	// that don't conform to the full Supabase query builder interface
	from?: (table: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export let createMockSupabaseClient = (overrides: MockOverrides = {}): SupabaseClient => {
	let defaultAuth = {
		getUser: mock(async (_token: string) => ({
			data: { user: { id: 'test-user-id' } },
			error: null,
		})),
		signInWithPassword: mock(async (credentials: { email: string; password: string }) => ({
			data: {
				user: { id: 'test-user-id', email: credentials.email },
				session: {
					user: { id: 'test-user-id', email: credentials.email },
					access_token: 'test-token',
					refresh_token: 'test-refresh-token',
				},
			},
			error: null,
		})),
		signUp: mock(async (credentials: { email: string; password: string }) => ({
			data: {
				user: { id: 'new-user-id', email: credentials.email },
				session: {
					user: { id: 'new-user-id', email: credentials.email },
					access_token: 'new-token',
					refresh_token: 'new-refresh-token',
				},
			},
			error: null,
		})),
		refreshSession: mock(async (_params: { refresh_token: string }) => ({
			data: {
				user: { id: 'test-user-id', email: 'test@example.com' },
				session: {
					user: { id: 'test-user-id', email: 'test@example.com' },
					access_token: 'refreshed-token',
					refresh_token: 'new-refresh-token',
				},
			},
			error: null,
		})),
	}

	// Default mock for the 'from' method that provides common query builder patterns
	let createDefaultQueryBuilder = () => ({
		select: mock((_columns: string = '*') => ({
			eq: mock((_column: string, _value: unknown): MockQueryResult<unknown[]> => ({
				data: [],
				error: null,
			})),
			single: mock((): MockSingleResult<unknown> => ({
				data: null,
				error: null,
			})),
			maybeSingle: mock((): MockSingleResult<unknown> => ({
				data: null,
				error: null,
			})),
			data: [],
			error: null,
		})),
		insert: mock((_data: unknown) => ({
			select: mock(() => ({
				single: mock((): MockSingleResult<unknown> => ({
					data: null,
					error: null,
				})),
				data: null,
				error: null,
			})),
			data: null,
			error: null,
		})),
		update: mock((_data: unknown) => ({
			eq: mock((_column: string, _value: unknown): MockQueryResult<unknown> => ({
				data: null,
				error: null,
			})),
		})),
		delete: mock(() => ({
			eq: mock((_column: string, _value: unknown): MockQueryResult<unknown> => ({
				data: null,
				error: null,
			})),
		})),
	})

	let defaultFrom = mock((table: string) => {
		if (!VALID_TABLES.has(table)) {
			throw new Error(`Mock Supabase: unknown table "${table}"`)
		}
		return createDefaultQueryBuilder()
	})

	let client = {
		auth: overrides.auth || defaultAuth,
		from: overrides.from || defaultFrom,
	}

	// Cast is necessary since we're providing a partial mock implementation
	// that only includes the methods used in tests
	return client as unknown as SupabaseClient
}
