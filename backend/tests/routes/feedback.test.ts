import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { createFeedbackRoutes } from '../../src/routes/feedback'
import { createMockSupabaseClient } from '../mocks/supabase'
import { feedbackResponseSchema } from '../../src/schemas/feedback'

type Variables = {
	userId: string
}

describe('POST /api/feedback', () => {
	test('should create feedback for introduction', async () => {
		let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
		let mockFeedback = {
			id: '650e8400-e29b-41d4-a716-446655440001',
			introduction_id: '750e8400-e29b-41d4-a716-446655440002',
			from_person_id: '850e8400-e29b-41d4-a716-446655440003',
			content: 'Had a great time!',
			sentiment: 'positive',
			created_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				insert: mock((data: any) => ({
					select: mock(() => ({
						single: mock(() => ({
							data: mockFeedback,
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
		app.route('/', createFeedbackRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				introduction_id: '750e8400-e29b-41d4-a716-446655440002',
				from_person_id: '850e8400-e29b-41d4-a716-446655440003',
				content: 'Had a great time!',
				sentiment: 'positive',
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockFeedback

		expect(res.status).toBe(201)
		expect(json.content).toBe('Had a great time!')
		expect(json.sentiment).toBe('positive')
		expect(json.introduction_id).toBe('750e8400-e29b-41d4-a716-446655440002')
		feedbackResponseSchema.parse(json)
	})

	test('should validate required fields', async () => {
		let mockClient = createMockSupabaseClient()

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', 'test-user')
			await next()
		})
		app.route('/', createFeedbackRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: 'Test' }),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
	})
})

describe('GET /api/feedback', () => {
	test('should list feedback for introduction', async () => {
		let mockUserId = '950e8400-e29b-41d4-a716-446655440000'
		let mockIntroductionId = 'a50e8400-e29b-41d4-a716-446655440001'
		let mockFeedback = [
			{
				id: 'b50e8400-e29b-41d4-a716-446655440002',
				introduction_id: mockIntroductionId,
				from_person_id: 'c50e8400-e29b-41d4-a716-446655440003',
				content: 'Great date!',
				sentiment: 'positive',
				created_at: new Date().toISOString(),
			},
			{
				id: 'd50e8400-e29b-41d4-a716-446655440004',
				introduction_id: mockIntroductionId,
				from_person_id: 'e50e8400-e29b-41d4-a716-446655440005',
				content: 'Not a good match',
				sentiment: 'negative',
				created_at: new Date().toISOString(),
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						data: mockFeedback,
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
		app.route('/', createFeedbackRoutes(mockClient))

		let req = new Request(`http://localhost/?introductionId=${mockIntroductionId}`)

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockFeedback

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(2)
		expect(json[0]?.content).toBe('Great date!')
		expect(json[1]?.sentiment).toBe('negative')
	})

	test('should return empty array if no feedback', async () => {
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
		app.route('/', createFeedbackRoutes(mockClient))

		let req = new Request('http://localhost/?introductionId=test-id')

		let res = await app.fetch(req)
		let json = (await res.json()) as any[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(0)
	})
})

describe('GET /api/feedback/:id', () => {
	test('should return feedback by ID', async () => {
		let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
		let mockFeedbackId = '650e8400-e29b-41d4-a716-446655440001'
		let mockFeedback = {
			id: mockFeedbackId,
			introduction_id: '750e8400-e29b-41d4-a716-446655440002',
			from_person_id: '850e8400-e29b-41d4-a716-446655440003',
			content: 'It was okay',
			sentiment: 'neutral',
			created_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						maybeSingle: mock(() => ({
							data: mockFeedback,
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
		app.route('/', createFeedbackRoutes(mockClient))

		let req = new Request(`http://localhost/${mockFeedbackId}`)

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockFeedback

		expect(res.status).toBe(200)
		expect(json.id).toBe(mockFeedbackId)
		expect(json.content).toBe('It was okay')
		expect(json.sentiment).toBe('neutral')
		feedbackResponseSchema.parse(json)
	})

	test('should return 404 when feedback not found', async () => {
		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						maybeSingle: mock(() => ({
							data: null,
							error: null,
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
		app.route('/', createFeedbackRoutes(mockClient))

		let req = new Request('http://localhost/nonexistent-id')

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Feedback not found')
	})
})
