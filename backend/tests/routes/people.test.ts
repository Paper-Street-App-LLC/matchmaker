import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { createPeopleRoutes } from '../../src/routes/people'
import { createMockSupabaseClient } from '../mocks/supabase'
import { personResponseSchema } from '../../src/schemas/people'

type Variables = {
	userId: string
}

describe('POST /api/people', () => {
	test('should create person with matchmaker_id from context', async () => {
		let mockUserId = '550e8400-e29b-41d4-a716-446655440000'
		let mockPerson = {
			id: '650e8400-e29b-41d4-a716-446655440001',
			matchmaker_id: mockUserId,
			name: 'John Doe',
			age: null,
			location: null,
			gender: null,
			preferences: null,
			personality: null,
			notes: null,
			active: true,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				insert: mock((data: any) => ({
					select: mock(() => ({
						single: mock(() => ({
							data: mockPerson,
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
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'John Doe' }),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockPerson

		expect(res.status).toBe(201)
		expect(json.name).toBe('John Doe')
		expect(json.matchmaker_id).toBe(mockUserId)
		personResponseSchema.parse(json)
	})

	test('should validate name is required', async () => {
		let mockClient = createMockSupabaseClient()

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', 'test-user')
			await next()
		})
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: '' }),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(400)
	})

	test('should return 201 with created person', async () => {
		let mockPerson = {
			id: '750e8400-e29b-41d4-a716-446655440002',
			matchmaker_id: '850e8400-e29b-41d4-a716-446655440003',
			name: 'Jane Doe',
			age: 28,
			location: 'San Francisco',
			gender: 'female',
			preferences: { ageRange: { min: 25, max: 35 } },
			personality: { traits: ['outgoing', 'creative'] },
			notes: 'Loves hiking',
			active: true,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				insert: mock((data: any) => ({
					select: mock(() => ({
						single: mock(() => ({
							data: mockPerson,
							error: null,
						})),
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', '850e8400-e29b-41d4-a716-446655440003')
			await next()
		})
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'Jane Doe',
				age: 28,
				location: 'San Francisco',
				gender: 'female',
				preferences: { ageRange: { min: 25, max: 35 } },
				personality: { traits: ['outgoing', 'creative'] },
				notes: 'Loves hiking',
			}),
		})

		let res = await app.fetch(req)

		expect(res.status).toBe(201)
	})
})

describe('GET /api/people', () => {
	test('should list people filtered by matchmaker_id', async () => {
		let mockUserId = '950e8400-e29b-41d4-a716-446655440004'
		let mockPeople = [
			{
				id: 'a50e8400-e29b-41d4-a716-446655440005',
				matchmaker_id: mockUserId,
				name: 'Person One',
				age: null,
				location: null,
				gender: null,
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			{
				id: 'b50e8400-e29b-41d4-a716-446655440006',
				matchmaker_id: mockUserId,
				name: 'Person Two',
				age: 30,
				location: 'NYC',
				gender: 'male',
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						data: mockPeople,
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
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/')

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockPeople

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(2)
		expect(json[0]?.name).toBe('Person One')
		expect(json[1]?.name).toBe('Person Two')
	})

	test('should return empty array if no people', async () => {
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
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/')

		let res = await app.fetch(req)
		let json = (await res.json()) as any[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(0)
	})

	test('should return 200 with people array', async () => {
		let mockPeople = [
			{
				id: 'c50e8400-e29b-41d4-a716-446655440007',
				matchmaker_id: 'd50e8400-e29b-41d4-a716-446655440008',
				name: 'Test Person',
				age: null,
				location: null,
				gender: null,
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		]

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						data: mockPeople,
						error: null,
					})),
				})),
			})),
		})

		let app = new Hono<{ Variables: Variables }>()
		app.use('*', async (c, next) => {
			c.set('userId', 'd50e8400-e29b-41d4-a716-446655440008')
			await next()
		})
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/')

		let res = await app.fetch(req)

		expect(res.status).toBe(200)
	})
})

describe('GET /api/people/:id', () => {
	test('should return person by ID', async () => {
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

		let mockClient = createMockSupabaseClient({
			from: mock((table: string) => ({
				select: mock((columns: string) => ({
					eq: mock((column: string, value: any) => ({
						eq: mock((column2: string, value2: any) => ({
							maybeSingle: mock(() => ({
								data: mockPerson,
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
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request(`http://localhost/${mockPersonId}`)

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockPerson

		expect(res.status).toBe(200)
		expect(json.id).toBe(mockPersonId)
		expect(json.name).toBe('John Doe')
		expect(json.matchmaker_id).toBe(mockUserId)
		personResponseSchema.parse(json)
	})

	test('should return 404 when person not found', async () => {
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
			c.set('userId', 'user-123')
			await next()
		})
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/nonexistent-id')

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})

describe('PUT /api/people/:id', () => {
	test('should update person fields', async () => {
		let mockUserId = '750e8400-e29b-41d4-a716-446655440000'
		let mockPersonId = '850e8400-e29b-41d4-a716-446655440001'
		let mockUpdatedPerson = {
			id: mockPersonId,
			matchmaker_id: mockUserId,
			name: 'John Updated',
			age: 31,
			location: 'Boston',
			gender: 'male',
			preferences: { ageRange: { min: 28, max: 35 } },
			personality: { traits: ['introverted'] },
			notes: 'Updated notes',
			active: true,
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
									data: mockUpdatedPerson,
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
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request(`http://localhost/${mockPersonId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: 'John Updated',
				age: 31,
				location: 'Boston',
				preferences: { ageRange: { min: 28, max: 35 } },
				personality: { traits: ['introverted'] },
				notes: 'Updated notes',
			}),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockUpdatedPerson

		expect(res.status).toBe(200)
		expect(json.id).toBe(mockPersonId)
		expect(json.name).toBe('John Updated')
		expect(json.age).toBe(31)
		expect(json.location).toBe('Boston')
		personResponseSchema.parse(json)
	})

	test('should return 404 when person not found', async () => {
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
			c.set('userId', 'user-123')
			await next()
		})
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/nonexistent-id', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Test' }),
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})

describe('DELETE /api/people/:id', () => {
	test('should soft delete person (set active=false)', async () => {
		let mockUserId = 'a50e8400-e29b-41d4-a716-446655440000'
		let mockPersonId = 'b50e8400-e29b-41d4-a716-446655440001'
		let mockDeletedPerson = {
			id: mockPersonId,
			matchmaker_id: mockUserId,
			name: 'John Doe',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: null,
			personality: null,
			notes: null,
			active: false,
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
									data: mockDeletedPerson,
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
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request(`http://localhost/${mockPersonId}`, {
			method: 'DELETE',
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as typeof mockDeletedPerson

		expect(res.status).toBe(200)
		expect(json.id).toBe(mockPersonId)
		expect(json.active).toBe(false)
		personResponseSchema.parse(json)
	})

	test('should return 404 when person not found', async () => {
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
			c.set('userId', 'user-123')
			await next()
		})
		app.route('/', createPeopleRoutes(mockClient))

		let req = new Request('http://localhost/nonexistent-id', {
			method: 'DELETE',
		})

		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})
