import { mock } from 'bun:test'
import type { SupabaseClient } from '@supabase/supabase-js'

type MockOverrides = {
	auth?: {
		getUser?: (token: string) => Promise<{
			data: { user: { id: string } | null }
			error: { message: string } | null
		}>
	}
	from?: (table: string) => any
}

export let createMockSupabaseClient = (
	overrides: MockOverrides = {}
): SupabaseClient => {
	let defaultAuth = {
		getUser: mock(async (token: string) => ({
			data: { user: { id: 'test-user-id' } },
			error: null,
		})),
	}

	let defaultFrom = mock((table: string) => ({
		select: mock((columns: string = '*') => ({
			eq: mock((column: string, value: any) => ({
				data: [],
				error: null,
			})),
			single: mock(() => ({
				data: null,
				error: null,
			})),
			data: [],
			error: null,
		})),
		insert: mock((data: any) => ({
			select: mock(() => ({
				single: mock(() => ({
					data: null,
					error: null,
				})),
				data: null,
				error: null,
			})),
			data: null,
			error: null,
		})),
		update: mock((data: any) => ({
			eq: mock((column: string, value: any) => ({
				data: null,
				error: null,
			})),
			data: null,
			error: null,
		})),
		delete: mock(() => ({
			eq: mock((column: string, value: any) => ({
				data: null,
				error: null,
			})),
			data: null,
			error: null,
		})),
	}))

	let client = {
		auth: overrides.auth || defaultAuth,
		from: overrides.from || defaultFrom,
	}

	return client as SupabaseClient
}
