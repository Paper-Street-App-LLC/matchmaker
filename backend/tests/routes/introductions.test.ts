import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import {
	createIntroductionsRoutes,
	type IntroductionsRouteDeps,
} from '../../src/routes/introductions'
import {
	InMemoryIntroductionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import {
	CreateIntroduction,
	GetIntroductionById,
	ListIntroductionsForMatchmaker,
	UpdateIntroduction,
} from '../../src/usecases'
import { fixedClock, fixedIds, makeIntroduction, makePerson } from '../usecases/fixtures'
import {
	introductionResponseSchema,
	type IntroductionResponse,
} from '../../src/schemas/introductions'

type Variables = { userId: string }

let MM_USER = '550e8400-e29b-41d4-a716-446655440000'
let MM_OTHER = '999e8400-e29b-41d4-a716-446655440099'
let MM_THIRD = '333e8400-e29b-41d4-a716-446655440033'
let PERSON_A = '750e8400-e29b-41d4-a716-446655440002'
let PERSON_B = '850e8400-e29b-41d4-a716-446655440003'

let buildDeps = (
	personRepo: InMemoryPersonRepository,
	introductionRepo: InMemoryIntroductionRepository,
): IntroductionsRouteDeps => ({
	createIntroduction: new CreateIntroduction({
		personRepo,
		introductionRepo,
		clock: fixedClock(),
		ids: fixedIds([
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
			'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
		]),
	}),
	getIntroductionById: new GetIntroductionById({ introductionRepo }),
	listIntroductionsForMatchmaker: new ListIntroductionsForMatchmaker({
		introductionRepo,
	}),
	updateIntroduction: new UpdateIntroduction({ introductionRepo }),
})

let mountApp = (deps: IntroductionsRouteDeps, userId: string) => {
	let app = new Hono<{ Variables: Variables }>()
	app.use('*', async (c, next) => {
		c.set('userId', userId)
		await next()
	})
	app.route('/', createIntroductionsRoutes(deps))
	return app
}

describe('POST /api/introductions', () => {
	test('creates a cross-matchmaker introduction when caller owns personA', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({ id: PERSON_A, matchmakerId: MM_USER }),
			makePerson({ id: PERSON_B, matchmakerId: MM_OTHER }),
		])
		let introductionRepo = new InMemoryIntroductionRepository()
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ person_a_id: PERSON_A, person_b_id: PERSON_B }),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as IntroductionResponse

		// Assert
		expect(res.status).toBe(201)
		expect(json.status).toBe('pending')
		expect(json.matchmaker_a_id).toBe(MM_USER)
		expect(json.matchmaker_b_id).toBe(MM_OTHER)
		expect(json.person_a_id).toBe(PERSON_A)
		expect(json.person_b_id).toBe(PERSON_B)
		introductionResponseSchema.parse(json)
	})

	test('returns 400 when body is missing required fields', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let introductionRepo = new InMemoryIntroductionRepository()
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notes: 'Test' }),
		})
		let res = await app.fetch(req)

		// Assert
		expect(res.status).toBe(400)
	})

	test('returns 403 when the caller owns neither person', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({ id: PERSON_A, matchmakerId: MM_OTHER }),
			makePerson({ id: PERSON_B, matchmakerId: MM_THIRD }),
		])
		let introductionRepo = new InMemoryIntroductionRepository()
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ person_a_id: PERSON_A, person_b_id: PERSON_B }),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(403)
		expect(json.error).toBe('You must own at least one person in the introduction')
	})
})

describe('GET /api/introductions', () => {
	test('lists introductions where the caller is either matchmaker', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let introductionRepo = new InMemoryIntroductionRepository([
			makeIntroduction({
				id: 'a50e8400-e29b-41d4-a716-446655440001',
				matchmakerAId: MM_USER,
				matchmakerBId: MM_OTHER,
				personAId: PERSON_A,
				personBId: PERSON_B,
			}),
		])
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request('http://localhost/'))
		let json = (await res.json()) as IntroductionResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(json).toHaveLength(1)
		expect(json[0]?.matchmaker_a_id).toBe(MM_USER)
		expect(json[0]?.matchmaker_b_id).toBe(MM_OTHER)
	})

	test('returns an empty array when no introductions exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let introductionRepo = new InMemoryIntroductionRepository()
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request('http://localhost/'))
		let json = (await res.json()) as IntroductionResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(json).toHaveLength(0)
	})
})

describe('GET /api/introductions/:id', () => {
	test('returns an introduction when the caller is a party', async () => {
		// Arrange
		let introId = '650e8400-e29b-41d4-a716-446655440001'
		let personRepo = new InMemoryPersonRepository()
		let introductionRepo = new InMemoryIntroductionRepository([
			makeIntroduction({
				id: introId,
				matchmakerAId: MM_USER,
				matchmakerBId: MM_OTHER,
				personAId: PERSON_A,
				personBId: PERSON_B,
				status: 'dating',
				notes: 'They hit it off!',
			}),
		])
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${introId}`))
		let json = (await res.json()) as IntroductionResponse

		// Assert
		expect(res.status).toBe(200)
		expect(json.id).toBe(introId)
		expect(json.status).toBe('dating')
		introductionResponseSchema.parse(json)
	})

	test('returns 404 when the introduction does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let introductionRepo = new InMemoryIntroductionRepository()
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request('http://localhost/nonexistent-id'))
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Introduction not found')
	})
})

describe('PUT /api/introductions/:id', () => {
	test('updates introduction status and notes', async () => {
		// Arrange
		let introId = '850e8400-e29b-41d4-a716-446655440001'
		let personRepo = new InMemoryPersonRepository()
		let introductionRepo = new InMemoryIntroductionRepository([
			makeIntroduction({
				id: introId,
				matchmakerAId: MM_USER,
				matchmakerBId: MM_OTHER,
				personAId: PERSON_A,
				personBId: PERSON_B,
			}),
		])
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let req = new Request(`http://localhost/${introId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'accepted', notes: 'Both interested!' }),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as IntroductionResponse

		// Assert
		expect(res.status).toBe(200)
		expect(json.status).toBe('accepted')
		expect(json.notes).toBe('Both interested!')
		introductionResponseSchema.parse(json)
	})

	test('returns 404 when the introduction does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let introductionRepo = new InMemoryIntroductionRepository()
		let app = mountApp(buildDeps(personRepo, introductionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/nonexistent-id', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'accepted' }),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Introduction not found')
	})
})
