import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { createMatchesRoutes } from '../../src/routes/matches'
import { createMockSupabaseClient } from '../mocks/supabase'
import type { MatchResponse } from '../../src/schemas/matches'

type Variables = {
	userId: string
}

type ErrorResponse = {
	error: string
}

describe('GET /api/matches/:personId', () => {
	test('should return match suggestions for person', async () => {
		let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
		let mockPersonId = '650e8400-e29b-41d4-a716-446655440001'
		let mockPerson = {
			id: mockPersonId,
			matchmaker_id: mockUserId,
			name: 'John Doe',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: null,
			personality: null,
			notes: null,
			active: true,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockAllPeople = [
			mockPerson,
			{
				id: '750e8400-e29b-41d4-a716-446655440002',
				matchmaker_id: mockUserId,
				name: 'Jane Doe',
				age: 28,
				location: 'NYC',
				gender: 'female',
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => {
				if (table === 'match_decisions') {
					return {
						select: mock((_columns: string) => ({
							eq: mock((_col: string, _val: unknown) => ({
								eq: mock((_col2: string, _val2: unknown) => ({
									data: [],
									error: null,
								})),
							})),
						})),
					}
				}
				// people table
				return {
					select: mock((_columns: string) => ({
						eq: mock((column: string, value: unknown) => {
							if (column === 'id' && value === mockPersonId) {
								return {
									eq: mock((_col2: string, _val2: unknown) => ({
										maybeSingle: mock(() => ({
											data: mockPerson,
											error: null,
										})),
									})),
								}
							}
							// .eq('active', true) — return all people for matchFinder
							if (column === 'active') {
								return {
									data: mockAllPeople,
									error: null,
								}
							}
							return { data: null, error: null }
						}),
					})),
				}
			}),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchesRoutes(mockClient))

		let req = new Request(`http://localhost/${mockPersonId}`)

		let res = await app.fetch(req)
		let json = (await res.json()) as MatchResponse[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		// Stub algorithm returns empty array
		expect(json).toHaveLength(0)
	})

	test('should return 404 when person not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_column: string, _value: unknown) => ({
						eq: mock((_column2: string, _value2: unknown) => ({
							maybeSingle: mock(() => ({
								data: null,
								error: null,
							})),
						})),
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', 'test-user')
			await next()
		})
		app.route('/', createMatchesRoutes(mockClient))

		let req = new Request('http://localhost/nonexistent-id')

		let res = await app.fetch(req)
		let json = (await res.json()) as ErrorResponse

		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})
