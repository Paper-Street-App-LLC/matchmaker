import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseUserMappingDb } from '../../src/store/user-provider-mappings'
import { DuplicateMappingError } from '../../src/services/user-mapping'

type MaybeSingleResult = {
	data: { user_id: string } | null
	error: { message: string; code?: string } | null
}

type InsertResult = { error: { message: string; code?: string } | null }

type FromShape = {
	insert: (values: Record<string, unknown>) => Promise<InsertResult>
	select: (columns: string) => {
		eq: (
			column: string,
			value: string,
		) => {
			eq: (
				column: string,
				value: string,
			) => {
				maybeSingle: () => Promise<MaybeSingleResult>
			}
		}
	}
}

type AuthAdminCreateUserArg = {
	user_metadata?: Record<string, unknown>
	[key: string]: unknown
}

type AuthAdmin = {
	createUser: (args: AuthAdminCreateUserArg) => Promise<{
		data: { user: { id: string } | null }
		error: { message: string } | null
	}>
	deleteUser: (userId: string) => Promise<{
		data: Record<string, unknown> | null
		error: { message: string } | null
	}>
}

type MockClient = {
	from: (table: string) => FromShape
	auth: { admin: AuthAdmin }
}

function asSupabase(client: MockClient): SupabaseClient {
	return client as unknown as SupabaseClient
}

function defaultFromShape(): FromShape {
	return {
		insert: () => Promise.resolve({ error: null }),
		select: () => ({
			eq: () => ({
				eq: () => ({
					maybeSingle: () => Promise.resolve({ data: null, error: null }),
				}),
			}),
		}),
	}
}

function createMockClient(overrides: Partial<MockClient> = {}): MockClient {
	return {
		from: overrides.from ?? (() => defaultFromShape()),
		auth: overrides.auth ?? {
			admin: {
				createUser: async () => ({
					data: { user: { id: 'auth-user-1' } },
					error: null,
				}),
				deleteUser: async () => ({ data: {}, error: null }),
			},
		},
	}
}

describe('createSupabaseUserMappingDb', () => {
	let client: MockClient

	beforeEach(() => {
		client = createMockClient()
	})

	describe('findUserId', () => {
		test('chains select(user_id) → eq(provider) → eq(sender_id) → maybeSingle', async () => {
			let calls = {
				table: '',
				select: '',
				eq1: { column: '', value: '' },
				eq2: { column: '', value: '' },
			}
			client = createMockClient({
				from: (table: string) => {
					calls.table = table
					return {
						insert: () => Promise.resolve({ error: null }),
						select: (columns: string) => {
							calls.select = columns
							return {
								eq: (col1: string, val1: string) => {
									calls.eq1 = { column: col1, value: val1 }
									return {
										eq: (col2: string, val2: string) => {
											calls.eq2 = { column: col2, value: val2 }
											return {
												maybeSingle: () =>
													Promise.resolve({ data: null, error: null }),
											}
										},
									}
								},
							}
						},
					}
				},
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			await db.findUserId('telegram', '12345')

			expect(calls.table).toBe('user_provider_mappings')
			expect(calls.select).toBe('user_id')
			expect(calls.eq1).toEqual({ column: 'provider', value: 'telegram' })
			expect(calls.eq2).toEqual({ column: 'sender_id', value: '12345' })
		})

		test('returns the user_id when a row is found', async () => {
			client = createMockClient({
				from: () => ({
					insert: () => Promise.resolve({ error: null }),
					select: () => ({
						eq: () => ({
							eq: () => ({
								maybeSingle: () =>
									Promise.resolve({ data: { user_id: 'abc-123' }, error: null }),
							}),
						}),
					}),
				}),
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			let result = await db.findUserId('telegram', '12345')

			expect(result).toBe('abc-123')
		})

		test('returns null when no row is found', async () => {
			let db = createSupabaseUserMappingDb(asSupabase(client))

			let result = await db.findUserId('telegram', '12345')

			expect(result).toBeNull()
		})

		test('throws preserving the Supabase error as cause', async () => {
			let originalError = { message: 'lookup failed', code: '42501' }
			client = createMockClient({
				from: () => ({
					insert: () => Promise.resolve({ error: null }),
					select: () => ({
						eq: () => ({
							eq: () => ({
								maybeSingle: () =>
									Promise.resolve({ data: null, error: originalError }),
							}),
						}),
					}),
				}),
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			let caught: unknown = null
			try {
				await db.findUserId('telegram', '12345')
			} catch (err) {
				caught = err
			}

			expect(caught).toBeInstanceOf(Error)
			expect((caught as Error).message).toBe('lookup failed')
			expect((caught as Error).cause).toBe(originalError)
		})
	})

	describe('createUser', () => {
		test('calls auth.admin.createUser with provider/sender metadata and returns the new auth user id', async () => {
			let createUserMock = mock(async (_args: AuthAdminCreateUserArg) => ({
				data: { user: { id: 'new-user-id' } },
				error: null as { message: string } | null,
			}))
			client = createMockClient({
				auth: {
					admin: {
						createUser: createUserMock,
						deleteUser: async () => ({ data: {}, error: null }),
					},
				},
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			let id = await db.createUser({ provider: 'telegram', senderId: '12345' })

			expect(id).toBe('new-user-id')
			expect(createUserMock).toHaveBeenCalledTimes(1)
			let arg = createUserMock.mock.calls[0]?.[0] as AuthAdminCreateUserArg
			expect(arg.user_metadata).toMatchObject({
				provider: 'telegram',
				sender_id: '12345',
			})
		})

		test('throws preserving the Supabase auth error as cause', async () => {
			let originalError = { message: 'auth admin down' }
			client = createMockClient({
				auth: {
					admin: {
						createUser: async () => ({
							data: { user: null },
							error: originalError,
						}),
						deleteUser: async () => ({ data: {}, error: null }),
					},
				},
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			let caught: unknown = null
			try {
				await db.createUser({ provider: 'telegram', senderId: '12345' })
			} catch (err) {
				caught = err
			}

			expect(caught).toBeInstanceOf(Error)
			expect((caught as Error).message).toBe('auth admin down')
			expect((caught as Error).cause).toBe(originalError)
		})
	})

	describe('deleteUser', () => {
		test('calls auth.admin.deleteUser with the given user id', async () => {
			let deleteUserMock = mock(async (_userId: string) => ({
				data: {} as Record<string, unknown> | null,
				error: null as { message: string } | null,
			}))
			client = createMockClient({
				auth: {
					admin: {
						createUser: async () => ({
							data: { user: { id: 'auth-user-1' } },
							error: null,
						}),
						deleteUser: deleteUserMock,
					},
				},
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			await db.deleteUser('abc-123')

			expect(deleteUserMock).toHaveBeenCalledTimes(1)
			expect(deleteUserMock.mock.calls[0]?.[0]).toBe('abc-123')
		})

		test('throws preserving the Supabase auth error as cause', async () => {
			let originalError = { message: 'delete failed' }
			client = createMockClient({
				auth: {
					admin: {
						createUser: async () => ({
							data: { user: { id: 'auth-user-1' } },
							error: null,
						}),
						deleteUser: async () => ({
							data: null,
							error: originalError,
						}),
					},
				},
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			let caught: unknown = null
			try {
				await db.deleteUser('abc-123')
			} catch (err) {
				caught = err
			}

			expect(caught).toBeInstanceOf(Error)
			expect((caught as Error).message).toBe('delete failed')
			expect((caught as Error).cause).toBe(originalError)
		})
	})

	describe('insertMapping', () => {
		test('inserts the row into user_provider_mappings', async () => {
			let insertMock = mock((_row: Record<string, unknown>) =>
				Promise.resolve({ error: null }),
			)
			let fromMock = mock((_table: string) => ({
				insert: insertMock,
				select: () => ({
					eq: () => ({
						eq: () => ({
							maybeSingle: () => Promise.resolve({ data: null, error: null }),
						}),
					}),
				}),
			}))
			client = createMockClient({ from: fromMock as unknown as MockClient['from'] })
			let db = createSupabaseUserMappingDb(asSupabase(client))

			await db.insertMapping('telegram', '12345', 'abc-123')

			expect(fromMock).toHaveBeenCalledWith('user_provider_mappings')
			expect(insertMock).toHaveBeenCalledTimes(1)
			expect(insertMock.mock.calls[0]?.[0]).toEqual({
				provider: 'telegram',
				sender_id: '12345',
				user_id: 'abc-123',
			})
		})

		test('translates Postgres unique-violation (23505) into DuplicateMappingError', async () => {
			client = createMockClient({
				from: () => ({
					insert: () =>
						Promise.resolve({
							error: { message: 'duplicate key', code: '23505' },
						}),
					select: () => ({
						eq: () => ({
							eq: () => ({
								maybeSingle: () => Promise.resolve({ data: null, error: null }),
							}),
						}),
					}),
				}),
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			await expect(
				db.insertMapping('telegram', '12345', 'abc-123'),
			).rejects.toBeInstanceOf(DuplicateMappingError)
		})

		test('throws plain Error preserving the Supabase error as cause for non-unique-violation errors', async () => {
			let originalError = { message: 'permission denied', code: '42501' }
			client = createMockClient({
				from: () => ({
					insert: () =>
						Promise.resolve({
							error: originalError,
						}),
					select: () => ({
						eq: () => ({
							eq: () => ({
								maybeSingle: () => Promise.resolve({ data: null, error: null }),
							}),
						}),
					}),
				}),
			})
			let db = createSupabaseUserMappingDb(asSupabase(client))

			let caught: unknown = null
			try {
				await db.insertMapping('telegram', '12345', 'abc-123')
			} catch (err) {
				caught = err
			}

			expect(caught).toBeInstanceOf(Error)
			expect(caught).not.toBeInstanceOf(DuplicateMappingError)
			expect((caught as Error).message).toBe('permission denied')
			expect((caught as Error).cause).toBe(originalError)
		})
	})
})
