import { describe, test, expect, mock } from 'bun:test'
import { resolveOrCreate } from '../../src/services/user-mapping'
import type { SupabaseClient } from '@supabase/supabase-js'

let createMockClient = (overrides: {
	selectResult?: { data: unknown; error: unknown }
	createUserResult?: { data: unknown; error: unknown }
	insertResult?: { data: unknown; error: unknown }
} = {}): SupabaseClient => {
	let fromMock = mock((_table: string) => ({
		select: mock(() => ({
			eq: mock(() => ({
				eq: mock(() => ({
					maybeSingle: mock(async () =>
						overrides.selectResult ?? { data: null, error: null }
					),
				})),
			})),
		})),
		insert: mock(() => ({
			select: mock(() => ({
				single: mock(async () =>
					overrides.insertResult ?? {
						data: {
							id: 'mapping-1',
							user_id: 'new-user-id',
							provider: 'telegram',
							sender_id: '12345',
						},
						error: null,
					}
				),
			})),
		})),
	}))

	let authMock = {
		admin: {
			createUser: mock(async () =>
				overrides.createUserResult ?? {
					data: { user: { id: 'new-user-id' } },
					error: null,
				}
			),
		},
	}

	return { from: fromMock, auth: authMock } as unknown as SupabaseClient
}

describe('resolveOrCreate', () => {
	test('returns existing userId when mapping exists', async () => {
		let client = createMockClient({
			selectResult: {
				data: { user_id: 'existing-user-id' },
				error: null,
			},
		})

		let userId = await resolveOrCreate(client, 'telegram', '12345')

		expect(userId).toBe('existing-user-id')
		expect(client.auth.admin.createUser).not.toHaveBeenCalled()
	})

	test('creates new user and mapping when none exists', async () => {
		let client = createMockClient()

		let userId = await resolveOrCreate(client, 'telegram', '12345')

		expect(userId).toBe('new-user-id')
		expect(client.auth.admin.createUser).toHaveBeenCalled()
		expect(client.from).toHaveBeenCalledWith('user_provider_mappings')
	})

	test('throws when user creation fails', async () => {
		let client = createMockClient({
			createUserResult: {
				data: { user: null },
				error: { message: 'creation failed' },
			},
		})

		await expect(resolveOrCreate(client, 'telegram', '12345')).rejects.toThrow(
			'Failed to create user'
		)
	})

	test('throws when mapping insert fails', async () => {
		let client = createMockClient({
			insertResult: {
				data: null,
				error: { message: 'unique constraint' },
			},
		})

		await expect(resolveOrCreate(client, 'telegram', '12345')).rejects.toThrow(
			'Failed to create user provider mapping'
		)
	})

	test('throws when mapping lookup fails', async () => {
		let client = createMockClient({
			selectResult: {
				data: null,
				error: { message: 'db error' },
			},
		})

		await expect(resolveOrCreate(client, 'telegram', '12345')).rejects.toThrow(
			'Failed to look up user provider mapping'
		)
	})
})
