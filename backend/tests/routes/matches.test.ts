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

let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
let otherMatchmakerId = '999e8400-e29b-41d4-a716-446655440099'
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
	is_seed: false,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
}

let createApp = (mockClient: ReturnType<typeof createMockSupabaseClient>) => {
	let app = new Hono<{ Variables: Variables }>()
	app.use('*', async (c, next) => {
		c.set('userId', mockUserId)
		await next()
	})
	app.route('/', createMatchesRoutes(mockClient))
	return app
}

describe('GET /api/matches/:personId', () => {
	test('should return match suggestions including cross-matchmaker candidates', async () => {
		let crossMatchmakerCandidate = {
			id: '850e8400-e29b-41d4-a716-446655440003',
			matchmaker_id: otherMatchmakerId,
			name: 'Lisa Smith',
			age: 28,
			location: 'NYC',
			gender: 'female',
			preferences: { likes: 'hiking' },
			personality: { type: 'extrovert' },
			notes: 'Secret notes',
			active: true,
			is_seed: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let allPeople = [mockPerson, crossMatchmakerCandidate]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => {
				if (table === 'people') {
					return {
						select: mock((_columns: string) => ({
							eq: mock((column: string, value: unknown) => {
								if (column === 'id' && value === mockPersonId) {
									return {
										eq: mock(() => ({
											maybeSingle: mock(() => ({
												data: mockPerson,
												error: null,
											})),
										})),
									}
								}
								if (column === 'active') {
									return {
										neq: mock(() => ({
											data: allPeople,
											error: null,
										})),
									}
								}
								return { data: null, error: null }
							}),
						})),
					}
				}
				if (table === 'match_decisions') {
					return {
						select: mock(() => ({
							eq: mock(() => ({
								eq: mock(() => ({
									data: [],
									error: null,
								})),
							})),
						})),
					}
				}
				if (table === 'introductions') {
					return {
						select: mock(() => ({
							or: mock(() => ({
								data: [],
								error: null,
							})),
						})),
					}
				}
				return { select: mock(() => ({ eq: mock(() => ({ data: [], error: null })) })) }
			}),
		})

		let app = createApp(mockClient)

		let res = await app.fetch(new Request(`http://localhost/${mockPersonId}`))
		let json = (await res.json()) as MatchResponse[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(1)

		// Cross-matchmaker candidate should be flagged
		expect(json[0].is_cross_matchmaker).toBe(true)
		expect(json[0].person.name).toBe('Lisa Smith')
		expect(json[0].match_explanation).toBeDefined()
		expect(json[0].compatibility_score).toBeGreaterThan(0)

		// Sensitive fields should be stripped
		expect('notes' in json[0].person).toBe(false)
		expect('preferences' in json[0].person).toBe(false)
		expect('personality' in json[0].person).toBe(false)
	})

	test('should exclude previously decided candidates', async () => {
		let decidedCandidate = {
			id: '850e8400-e29b-41d4-a716-446655440003',
			matchmaker_id: otherMatchmakerId,
			name: 'Decided Lisa',
			age: 28,
			location: 'NYC',
			gender: 'female',
			preferences: null,
			personality: null,
			notes: null,
			active: true,
			is_seed: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let freshCandidate = {
			id: '950e8400-e29b-41d4-a716-446655440004',
			matchmaker_id: otherMatchmakerId,
			name: 'Fresh Jane',
			age: 26,
			location: 'NYC',
			gender: 'female',
			preferences: null,
			personality: null,
			notes: null,
			active: true,
			is_seed: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let allPeople = [mockPerson, decidedCandidate, freshCandidate]
		let existingDecisions = [
			{
				candidate_id: decidedCandidate.id,
				decision: 'declined',
				decline_reason: 'not a good fit',
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => {
				if (table === 'people') {
					return {
						select: mock((_columns: string) => ({
							eq: mock((column: string, value: unknown) => {
								if (column === 'id' && value === mockPersonId) {
									return {
										eq: mock(() => ({
											maybeSingle: mock(() => ({
												data: mockPerson,
												error: null,
											})),
										})),
									}
								}
								if (column === 'active') {
									return {
										neq: mock(() => ({
											data: allPeople,
											error: null,
										})),
									}
								}
								return { data: null, error: null }
							}),
						})),
					}
				}
				if (table === 'match_decisions') {
					return {
						select: mock(() => ({
							eq: mock(() => ({
								eq: mock(() => ({
									data: existingDecisions,
									error: null,
								})),
							})),
						})),
					}
				}
				if (table === 'introductions') {
					return {
						select: mock(() => ({
							or: mock(() => ({
								data: [],
								error: null,
							})),
						})),
					}
				}
				return { select: mock(() => ({ eq: mock(() => ({ data: [], error: null })) })) }
			}),
		})

		let app = createApp(mockClient)

		let res = await app.fetch(new Request(`http://localhost/${mockPersonId}`))
		let json = (await res.json()) as MatchResponse[]

		expect(res.status).toBe(200)
		expect(json).toHaveLength(1)
		expect(json[0].person.name).toBe('Fresh Jane')
	})

	test('should limit results to 3', async () => {
		let candidates = Array.from({ length: 6 }, (_, i) => ({
			id: `850e8400-e29b-41d4-a716-44665544000${i}`,
			matchmaker_id: otherMatchmakerId,
			name: `Candidate ${i}`,
			age: 25 + i,
			location: 'NYC',
			gender: 'female',
			preferences: null,
			personality: null,
			notes: null,
			active: true,
			is_seed: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}))

		let allPeople = [mockPerson, ...candidates]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => {
				if (table === 'people') {
					return {
						select: mock((_columns: string) => ({
							eq: mock((column: string, value: unknown) => {
								if (column === 'id' && value === mockPersonId) {
									return {
										eq: mock(() => ({
											maybeSingle: mock(() => ({
												data: mockPerson,
												error: null,
											})),
										})),
									}
								}
								if (column === 'active') {
									return {
										neq: mock(() => ({
											data: allPeople,
											error: null,
										})),
									}
								}
								return { data: null, error: null }
							}),
						})),
					}
				}
				if (table === 'match_decisions') {
					return {
						select: mock(() => ({
							eq: mock(() => ({
								eq: mock(() => ({
									data: [],
									error: null,
								})),
							})),
						})),
					}
				}
				if (table === 'introductions') {
					return {
						select: mock(() => ({
							or: mock(() => ({
								data: [],
								error: null,
							})),
						})),
					}
				}
				return { select: mock(() => ({ eq: mock(() => ({ data: [], error: null })) })) }
			}),
		})

		let app = createApp(mockClient)

		let res = await app.fetch(new Request(`http://localhost/${mockPersonId}`))
		let json = (await res.json()) as MatchResponse[]

		expect(res.status).toBe(200)
		expect(json).toHaveLength(3)
	})

	test('should return 404 when person not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_column: string, _value: unknown) => ({
						eq: mock(() => ({
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

		let res = await app.fetch(new Request('http://localhost/nonexistent-id'))
		let json = (await res.json()) as ErrorResponse

		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})
