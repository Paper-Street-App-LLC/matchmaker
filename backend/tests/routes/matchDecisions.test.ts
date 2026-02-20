import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { createMatchDecisionsRoutes } from '../../src/routes/matchDecisions'
import { createMockSupabaseClient } from '../mocks/supabase'
import { decisionResponseSchema, type DecisionResponse } from '../../src/schemas/matchDecisions'

type Variables = {
	userId: string
}

let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
let mockPersonId = '650e8400-e29b-41d4-a716-446655440001'
let mockCandidateId = '750e8400-e29b-41d4-a716-446655440002'

describe('POST /api/match-decisions', () => {
	test('should record a declined decision with reason', async () => {
		let mockDecision = {
			id: '850e8400-e29b-41d4-a716-446655440003',
			matchmaker_id: mockUserId,
			person_id: mockPersonId,
			candidate_id: mockCandidateId,
			decision: 'declined',
			decline_reason: 'incompatible religion',
			created_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_col: string, _val: unknown) => ({
						eq: mock((_col2: string, _val2: unknown) => ({
							maybeSingle: mock(() => ({
								data: { id: mockPersonId },
								error: null,
							})),
						})),
					})),
				})),
				insert: mock((_data: unknown) => ({
					select: mock(() => ({
						single: mock(() => ({
							data: mockDecision,
							error: null,
						})),
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: mockPersonId,
				candidate_id: mockCandidateId,
				decision: 'declined',
				decline_reason: 'incompatible religion',
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockDecision

		expect(res.status).toBe(201)
		expect(json.decision).toBe('declined')
		expect(json.decline_reason).toBe('incompatible religion')
		expect(json.person_id).toBe(mockPersonId)
		expect(json.candidate_id).toBe(mockCandidateId)
		decisionResponseSchema.parse(json)
	})

	test('should record an accepted decision', async () => {
		let mockDecision = {
			id: '950e8400-e29b-41d4-a716-446655440004',
			matchmaker_id: mockUserId,
			person_id: mockPersonId,
			candidate_id: mockCandidateId,
			decision: 'accepted',
			decline_reason: null,
			created_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_col: string, _val: unknown) => ({
						eq: mock((_col2: string, _val2: unknown) => ({
							maybeSingle: mock(() => ({
								data: { id: mockPersonId },
								error: null,
							})),
						})),
					})),
				})),
				insert: mock((_data: unknown) => ({
					select: mock(() => ({
						single: mock(() => ({
							data: mockDecision,
							error: null,
						})),
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: mockPersonId,
				candidate_id: mockCandidateId,
				decision: 'accepted',
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockDecision

		expect(res.status).toBe(201)
		expect(json.decision).toBe('accepted')
		expect(json.decline_reason).toBeNull()
		decisionResponseSchema.parse(json)
	})

	test('should validate required fields', async () => {
		let mockClient = createMockSupabaseClient()

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ decision: 'declined' }), // missing person_id, candidate_id
		})

		let res = await app.fetch(req)
		expect(res.status).toBe(400)
	})

	test('should validate decision enum', async () => {
		let mockClient = createMockSupabaseClient()

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: mockPersonId,
				candidate_id: mockCandidateId,
				decision: 'maybe',
			}),
		})

		let res = await app.fetch(req)
		expect(res.status).toBe(400)
	})

	test('should return 404 when person not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_col: string, _val: unknown) => ({
						eq: mock((_col2: string, _val2: unknown) => ({
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
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: mockPersonId,
				candidate_id: mockCandidateId,
				decision: 'declined',
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})

describe('GET /api/match-decisions/:personId', () => {
	test('should list all decisions for a person', async () => {
		let mockDecisions = [
			{
				id: 'a50e8400-e29b-41d4-a716-446655440005',
				matchmaker_id: mockUserId,
				person_id: mockPersonId,
				candidate_id: mockCandidateId,
				decision: 'declined',
				decline_reason: 'age gap',
				created_at: new Date().toISOString(),
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_col: string, _val: unknown) => {
						// person ownership check returns person
						if (_col === 'id') {
							return {
								eq: mock((_col2: string, _val2: unknown) => ({
									maybeSingle: mock(() => ({
										data: { id: mockPersonId },
										error: null,
									})),
								})),
							}
						}
						// decisions query: .eq('person_id').eq('matchmaker_id')
						return {
							eq: mock((_col2: string, _val2: unknown) => ({
								data: mockDecisions,
								error: null,
							})),
						}
					}),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let res = await app.fetch(new Request(`http://localhost/${mockPersonId}`))
		let json = (await res.json()) as DecisionResponse[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(1)
		expect(json[0]?.decision).toBe('declined')
	})

	test('should return empty array if no decisions', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_col: string, _val: unknown) => {
						if (_col === 'id') {
							return {
								eq: mock((_col2: string, _val2: unknown) => ({
									maybeSingle: mock(() => ({
										data: { id: mockPersonId },
										error: null,
									})),
								})),
							}
						}
						return {
							eq: mock((_col2: string, _val2: unknown) => ({
								data: [],
								error: null,
							})),
						}
					}),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let res = await app.fetch(new Request(`http://localhost/${mockPersonId}`))
		let json = (await res.json()) as DecisionResponse[]

		expect(res.status).toBe(200)
		expect(json).toHaveLength(0)
	})

	test('should return 404 when person not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_col: string, _val: unknown) => ({
						eq: mock((_col2: string, _val2: unknown) => ({
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
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createMatchDecisionsRoutes(mockClient))

		let res = await app.fetch(new Request(`http://localhost/${mockPersonId}`))
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})
