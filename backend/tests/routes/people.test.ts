import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import { createPerson } from '@matchmaker/shared'
import { createPeopleRoutes, type PeopleRouteDeps } from '../../src/routes/people'
import { InMemoryPersonRepository } from '../fakes/in-memory-repositories'
import {
	CreatePerson,
	DeletePerson,
	GetPersonById,
	ListPeopleForMatchmaker,
	UpdatePerson,
} from '../../src/usecases'
import { FIXED_NOW, fixedClock, fixedIds } from '../usecases/fixtures'
import { personResponseSchema, type PersonResponse } from '../../src/schemas/people'

type Variables = { userId: string }

let MATCHMAKER_ID = '550e8400-e29b-41d4-a716-446655440000'
let OTHER_MATCHMAKER_ID = '660e8400-e29b-41d4-a716-446655440000'
let PERSON_ID = '650e8400-e29b-41d4-a716-446655440001'
let NEW_PERSON_ID = '750e8400-e29b-41d4-a716-446655440002'

let buildDeps = (personRepo: InMemoryPersonRepository): PeopleRouteDeps => ({
	createPerson: new CreatePerson({
		personRepo,
		clock: fixedClock(),
		ids: fixedIds([NEW_PERSON_ID]),
	}),
	getPersonById: new GetPersonById({ personRepo }),
	listPeopleForMatchmaker: new ListPeopleForMatchmaker({ personRepo }),
	updatePerson: new UpdatePerson({ personRepo }),
	deletePerson: new DeletePerson({ personRepo }),
})

let mountApp = (deps: PeopleRouteDeps, userId: string): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()
	app.use('*', async (c, next) => {
		c.set('userId', userId)
		await next()
	})
	app.route('/', createPeopleRoutes(deps))
	return app
}

let seedPerson = (overrides: Partial<Parameters<typeof createPerson>[0]> = {}) =>
	createPerson({
		id: PERSON_ID,
		matchmakerId: MATCHMAKER_ID,
		name: 'John Doe',
		age: null,
		location: null,
		gender: null,
		preferences: null,
		personality: null,
		notes: null,
		active: true,
		createdAt: FIXED_NOW,
		updatedAt: FIXED_NOW,
		...overrides,
	})

describe('POST /api/people', () => {
	test('creates a person with matchmaker_id from the auth context', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'John Doe' }),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as PersonResponse

		// Assert
		expect(res.status).toBe(201)
		expect(json.name).toBe('John Doe')
		expect(json.matchmaker_id).toBe(MATCHMAKER_ID)
		expect(json.id).toBe(NEW_PERSON_ID)
		personResponseSchema.parse(json)
		let saved = await personRepo.findById(NEW_PERSON_ID)
		expect(saved?.name).toBe('John Doe')
	})

	test('returns 400 when name is missing', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: '' }),
		})
		let res = await app.fetch(req)

		// Assert
		expect(res.status).toBe(400)
	})

	test('returns 201 with all optional fields populated', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
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
		let json = (await res.json()) as PersonResponse

		// Assert
		expect(res.status).toBe(201)
		expect(json.age).toBe(28)
		expect(json.location).toBe('San Francisco')
		expect(json.gender).toBe('female')
		expect(json.preferences).toEqual({ ageRange: { min: 25, max: 35 } })
	})
})

describe('GET /api/people', () => {
	test('lists people owned by the matchmaker', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			seedPerson({ id: 'a50e8400-e29b-41d4-a716-446655440005', name: 'Person One' }),
			seedPerson({ id: 'b50e8400-e29b-41d4-a716-446655440006', name: 'Person Two', age: 30, location: 'NYC', gender: 'male' }),
		])
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let res = await app.fetch(new Request('http://localhost/'))
		let json = (await res.json()) as PersonResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(2)
		expect(json[0]?.name).toBe('Person One')
		expect(json[1]?.name).toBe('Person Two')
	})

	test('returns empty array when no people exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let res = await app.fetch(new Request('http://localhost/'))
		let json = (await res.json()) as PersonResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(json).toHaveLength(0)
	})

	test('excludes people owned by other matchmakers', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			seedPerson({ id: 'mine', matchmakerId: MATCHMAKER_ID }),
			seedPerson({ id: 'theirs', matchmakerId: OTHER_MATCHMAKER_ID }),
		])
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let res = await app.fetch(new Request('http://localhost/'))
		let json = (await res.json()) as PersonResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(json).toHaveLength(1)
		expect(json[0]?.id).toBe('mine')
	})
})

describe('GET /api/people/:id', () => {
	test('returns a person by id when owned by the caller', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			seedPerson({ id: PERSON_ID, name: 'John Doe', age: 30, location: 'NYC', gender: 'male' }),
		])
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as PersonResponse

		// Assert
		expect(res.status).toBe(200)
		expect(json.id).toBe(PERSON_ID)
		expect(json.name).toBe('John Doe')
		expect(json.matchmaker_id).toBe(MATCHMAKER_ID)
		personResponseSchema.parse(json)
	})

	test('returns 404 when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let res = await app.fetch(new Request('http://localhost/nonexistent-id'))
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})

	test('returns the person when it belongs to another matchmaker (cross-matchmaker visibility)', async () => {
		// GET /:id mirrors find_matches' candidate pool: any active person is
		// inspectable regardless of who owns them.
		let personRepo = new InMemoryPersonRepository([
			seedPerson({ id: PERSON_ID, matchmakerId: OTHER_MATCHMAKER_ID }),
		])
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as PersonResponse

		expect(res.status).toBe(200)
		expect(json.id).toBe(PERSON_ID)
		expect(json.matchmaker_id).toBe(OTHER_MATCHMAKER_ID)
	})

	test('returns 404 when the person is soft-deleted (inactive)', async () => {
		let personRepo = new InMemoryPersonRepository([
			seedPerson({ id: PERSON_ID, active: false }),
		])
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))

		expect(res.status).toBe(404)
	})
})

describe('PUT /api/people/:id', () => {
	test('updates person fields', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			seedPerson({ id: PERSON_ID, name: 'Old Name' }),
		])
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let req = new Request(`http://localhost/${PERSON_ID}`, {
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
		let json = (await res.json()) as PersonResponse

		// Assert
		expect(res.status).toBe(200)
		expect(json.id).toBe(PERSON_ID)
		expect(json.name).toBe('John Updated')
		expect(json.age).toBe(31)
		expect(json.location).toBe('Boston')
		personResponseSchema.parse(json)
	})

	test('returns 404 when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let req = new Request('http://localhost/nonexistent-id', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'Test' }),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})

describe('DELETE /api/people/:id', () => {
	test('soft deletes a person by setting active=false', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			seedPerson({ id: PERSON_ID }),
		])
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let req = new Request(`http://localhost/${PERSON_ID}`, { method: 'DELETE' })
		let res = await app.fetch(req)
		let json = (await res.json()) as PersonResponse

		// Assert
		expect(res.status).toBe(200)
		expect(json.id).toBe(PERSON_ID)
		expect(json.active).toBe(false)
		personResponseSchema.parse(json)
	})

	test('returns 404 when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let app = mountApp(buildDeps(personRepo), MATCHMAKER_ID)

		// Act
		let req = new Request('http://localhost/nonexistent-id', { method: 'DELETE' })
		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})
