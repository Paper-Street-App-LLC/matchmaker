import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { createIntroductionsRoutes } from '../../src/routes/introductions'
import { createMockSupabaseClient } from '../mocks/supabase'
import { introductionResponseSchema } from '../../src/schemas/introductions'

type Variables = {
	userId: string
}

describe('POST /api/introductions', () => {
	test('should create introduction with pending status', async () => {
		let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
		let mockIntroduction = {
			id: '650e8400-e29b-41d4-a716-446655440001',
			matchmaker_id: mockUserId,
			person_a_id: '750e8400-e29b-41d4-a716-446655440002',
			person_b_id: '850e8400-e29b-41d4-a716-446655440003',
			status: 'pending',
			notes: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				insert: mock((data: any) => ({
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
				person_a_id: '750e8400-e29b-41d4-a716-446655440002',
				person_b_id: '850e8400-e29b-41d4-a716-446655440003',
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockIntroduction

		expect(res.status).toBe(201)
		expect(json.status).toBe('pending')
		expect(json.person_a_id).toBe('750e8400-e29b-41d4-a716-446655440002')
		expect(json.person_b_id).toBe('850e8400-e29b-41d4-a716-446655440003')
		expect(json.matchmaker_id).toBe(mockUserId)
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
})

describe('GET /api/introductions', () => {
	test('should list introductions filtered by matchmaker_id', async () => {
		let mockUserId = '950e8400-e29b-41d4-a716-446655440000'
		let mockIntroductions = [
			{
				id: 'a50e8400-e29b-41d4-a716-446655440001',
				matchmaker_id: mockUserId,
				person_a_id: 'b50e8400-e29b-41d4-a716-446655440002',
				person_b_id: 'c50e8400-e29b-41d4-a716-446655440003',
				status: 'pending',
				notes: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			{
				id: 'd50e8400-e29b-41d4-a716-446655440004',
				matchmaker_id: mockUserId,
				person_a_id: 'e50e8400-e29b-41d4-a716-446655440005',
				person_b_id: 'f50e8400-e29b-41d4-a716-446655440006',
				status: 'dating',
				notes: 'Going well',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
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

		let req = new Request('http://localhost/')

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockIntroductions

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(2)
		expect(json[0]?.status).toBe('pending')
		expect(json[1]?.status).toBe('dating')
	})

	test('should return empty array if no introductions', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
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

		let req = new Request('http://localhost/')

		let res = await app.fetch(req)
		let json = (await res.json()) as any[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(0)
	})
})

describe('GET /api/introductions/:id', () => {
	test('should return introduction by ID', async () => {
		let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
		let mockIntroductionId = '650e8400-e29b-41d4-a716-446655440001'
		let mockIntroduction = {
			id: mockIntroductionId,
			matchmaker_id: mockUserId,
			person_a_id: '750e8400-e29b-41d4-a716-446655440002',
			person_b_id: '850e8400-e29b-41d4-a716-446655440003',
			status: 'dating',
			notes: 'They hit it off!',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						eq: mock((column2: string, value2: any) => ({
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

		let req = new Request(`http://localhost/${mockIntroductionId}`)

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockIntroduction

		expect(res.status).toBe(200)
		expect(json.id).toBe(mockIntroductionId)
		expect(json.status).toBe('dating')
		expect(json.notes).toBe('They hit it off!')
		introductionResponseSchema.parse(json)
	})

	test('should return 404 when introduction not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						eq: mock((column2: string, value2: any) => ({
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

		let req = new Request('http://localhost/nonexistent-id')

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Introduction not found')
	})
})

describe('PUT /api/introductions/:id', () => {
	test('should update introduction status and notes', async () => {
		let mockUserId = '750e8400-e29b-41d4-a716-446655440000'
		let mockIntroductionId = '850e8400-e29b-41d4-a716-446655440001'
		let mockUpdatedIntroduction = {
			id: mockIntroductionId,
			matchmaker_id: mockUserId,
			person_a_id: '950e8400-e29b-41d4-a716-446655440002',
			person_b_id: 'a50e8400-e29b-41d4-a716-446655440003',
			status: 'accepted',
			notes: 'Both interested!',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				update: mock((data: any) => ({
					eq: mock((column: string, value: any) => ({
						eq: mock((column2: string, value2: any) => ({
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
		expect(json.id).toBe(mockIntroductionId)
		expect(json.status).toBe('accepted')
		expect(json.notes).toBe('Both interested!')
		introductionResponseSchema.parse(json)
	})

	test('should return 404 when introduction not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				update: mock((data: any) => ({
					eq: mock((column: string, value: any) => ({
						eq: mock((column2: string, value2: any) => ({
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
