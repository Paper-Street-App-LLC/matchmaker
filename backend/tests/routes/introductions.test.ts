import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { createIntroductionsRoutes } from '../../src/routes/introductions'
import { createMockSupabaseClient } from '../mocks/supabase'
import { introductionResponseSchema, type IntroductionResponse } from '../../src/schemas/introductions'

type Variables = {
	userId: string
}

let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
let otherMatchmakerId = '999e8400-e29b-41d4-a716-446655440099'
let personAId = '750e8400-e29b-41d4-a716-446655440002'
let personBId = '850e8400-e29b-41d4-a716-446655440003'

describe('POST /api/introductions', () => {
	test('should create cross-matchmaker introduction with both matchmaker IDs', async () => {
		let mockIntroduction = {
			id: '650e8400-e29b-41d4-a716-446655440001',
			matchmaker_a_id: mockUserId,
			matchmaker_b_id: otherMatchmakerId,
			person_a_id: personAId,
			person_b_id: personBId,
			status: 'pending',
			notes: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((column: string, value: unknown) => ({
						single: mock(() => {
							if (value === personAId) {
								return { data: { id: personAId, matchmaker_id: mockUserId }, error: null }
							}
							if (value === personBId) {
								return { data: { id: personBId, matchmaker_id: otherMatchmakerId }, error: null }
							}
							return { data: null, error: null }
						}),
					})),
				})),
				insert: mock((_data: any) => ({
					select: mock(() => ({
						single: mock(() => ({
							data: mockIntroduction,
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
		app.route('/', createIntroductionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_a_id: personAId,
				person_b_id: personBId,
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockIntroduction

		expect(res.status).toBe(201)
		expect(json.status).toBe('pending')
		expect(json.matchmaker_a_id).toBe(mockUserId)
		expect(json.matchmaker_b_id).toBe(otherMatchmakerId)
		expect(json.person_a_id).toBe(personAId)
		expect(json.person_b_id).toBe(personBId)
		introductionResponseSchema.parse(json)
	})

	test('should validate person_a_id and person_b_id are required', async () => {
		let mockClient = createMockSupabaseClient()

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', 'test-user')
			await next()
		})
		app.route('/', createIntroductionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notes: 'Test' }),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
	})

	test('should return 403 when user does not own either person', async () => {
		let thirdPartyMatchmaker = '333e8400-e29b-41d4-a716-446655440033'

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_column: string, value: unknown) => ({
						single: mock(() => {
							if (value === personAId) {
								return { data: { id: personAId, matchmaker_id: otherMatchmakerId }, error: null }
							}
							if (value === personBId) {
								return { data: { id: personBId, matchmaker_id: thirdPartyMatchmaker }, error: null }
							}
							return { data: null, error: null }
						}),
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createIntroductionsRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_a_id: personAId,
				person_b_id: personBId,
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(403)
		expect(json.error).toBe('You must own at least one person in the introduction')
	})
})

describe('GET /api/introductions', () => {
	test('should list introductions where user is either matchmaker', async () => {
		let mockIntroductions = [
			{
				id: 'a50e8400-e29b-41d4-a716-446655440001',
				matchmaker_a_id: mockUserId,
				matchmaker_b_id: otherMatchmakerId,
				person_a_id: personAId,
				person_b_id: personBId,
				status: 'pending',
				notes: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					or: mock((_filter: string) => ({
						data: mockIntroductions,
						error: null,
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', mockUserId)
			await next()
		})
		app.route('/', createIntroductionsRoutes(mockClient))

		let res = await app.fetch(new Request('http://localhost/'))
		let json = (await res.json()) as typeof mockIntroductions

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(1)
		expect(json[0]?.matchmaker_a_id).toBe(mockUserId)
		expect(json[0]?.matchmaker_b_id).toBe(otherMatchmakerId)
	})

	test('should return empty array if no introductions', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					or: mock((_filter: string) => ({
						data: [],
						error: null,
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', 'test-user')
			await next()
		})
		app.route('/', createIntroductionsRoutes(mockClient))

		let res = await app.fetch(new Request('http://localhost/'))
		let json = (await res.json()) as IntroductionResponse[]

		expect(res.status).toBe(200)
		expect(json).toHaveLength(0)
	})
})

describe('GET /api/introductions/:id', () => {
	test('should return introduction by ID for either matchmaker', async () => {
		let mockIntroductionId = '650e8400-e29b-41d4-a716-446655440001'
		let mockIntroduction = {
			id: mockIntroductionId,
			matchmaker_a_id: mockUserId,
			matchmaker_b_id: otherMatchmakerId,
			person_a_id: personAId,
			person_b_id: personBId,
			status: 'dating',
			notes: 'They hit it off!',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_column: string, _value: unknown) => ({
						or: mock((_filter: string) => ({
							maybeSingle: mock(() => ({
								data: mockIntroduction,
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
		app.route('/', createIntroductionsRoutes(mockClient))

		let res = await app.fetch(new Request(`http://localhost/${mockIntroductionId}`))
		let json = (await res.json()) as typeof mockIntroduction

		expect(res.status).toBe(200)
		expect(json.id).toBe(mockIntroductionId)
		expect(json.status).toBe('dating')
		introductionResponseSchema.parse(json)
	})

	test('should return 404 when introduction not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				select: mock((_columns: string) => ({
					eq: mock((_column: string, _value: unknown) => ({
						or: mock((_filter: string) => ({
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
		app.route('/', createIntroductionsRoutes(mockClient))

		let res = await app.fetch(new Request('http://localhost/nonexistent-id'))
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Introduction not found')
	})
})

describe('PUT /api/introductions/:id', () => {
	test('should update introduction status and notes', async () => {
		let mockIntroductionId = '850e8400-e29b-41d4-a716-446655440001'
		let mockUpdatedIntroduction = {
			id: mockIntroductionId,
			matchmaker_a_id: mockUserId,
			matchmaker_b_id: otherMatchmakerId,
			person_a_id: personAId,
			person_b_id: personBId,
			status: 'accepted',
			notes: 'Both interested!',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				update: mock((_data: any) => ({
					eq: mock((_column: string, _value: unknown) => ({
						or: mock((_filter: string) => ({
							select: mock(() => ({
								maybeSingle: mock(() => ({
									data: mockUpdatedIntroduction,
									error: null,
								})),
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
		app.route('/', createIntroductionsRoutes(mockClient))

		let req = new Request(`http://localhost/${mockIntroductionId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				status: 'accepted',
				notes: 'Both interested!',
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockUpdatedIntroduction

		expect(res.status).toBe(200)
		expect(json.status).toBe('accepted')
		expect(json.notes).toBe('Both interested!')
		introductionResponseSchema.parse(json)
	})

	test('should return 404 when introduction not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((_table: string) => ({
				update: mock((_data: any) => ({
					eq: mock((_column: string, _value: unknown) => ({
						or: mock((_filter: string) => ({
							select: mock(() => ({
								maybeSingle: mock(() => ({
									data: null,
									error: null,
								})),
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
		app.route('/', createIntroductionsRoutes(mockClient))

		let req = new Request('http://localhost/nonexistent-id', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'accepted' }),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Introduction not found')
	})
})
