import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import {
	createMatchDecisionsRoutes,
	type MatchDecisionsRouteDeps,
} from '../../src/routes/matchDecisions'
import {
	InMemoryMatchDecisionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import { ListMatchDecisions, RecordMatchDecision } from '../../src/usecases'
import { fixedClock, fixedIds, makeDecision, makePerson } from '../usecases/fixtures'
import {
	decisionResponseSchema,
	type DecisionResponse,
} from '../../src/schemas/matchDecisions'

type Variables = { userId: string }

let MM_USER = '550e8400-e29b-41d4-a716-446655440000'
let PERSON_ID = '650e8400-e29b-41d4-a716-446655440001'
let CANDIDATE_ID = '750e8400-e29b-41d4-a716-446655440002'
let NEW_DECISION_ID = '850e8400-e29b-41d4-a716-446655440003'

let buildDeps = (
	personRepo: InMemoryPersonRepository,
	matchDecisionRepo: InMemoryMatchDecisionRepository,
): MatchDecisionsRouteDeps => ({
	recordMatchDecision: new RecordMatchDecision({
		personRepo,
		matchDecisionRepo,
		clock: fixedClock(),
		ids: fixedIds([NEW_DECISION_ID]),
	}),
	listMatchDecisions: new ListMatchDecisions({ personRepo, matchDecisionRepo }),
})

let mountApp = (deps: MatchDecisionsRouteDeps, userId: string) => {
	let app = new Hono<{ Variables: Variables }>()
	app.use('*', async (c, next) => {
		c.set('userId', userId)
		await next()
	})
	app.route('/', createMatchDecisionsRoutes(deps))
	return app
}

describe('POST /api/match-decisions', () => {
	test('records a declined decision with reason', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({ id: PERSON_ID, matchmakerId: MM_USER }),
		])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: PERSON_ID,
				candidate_id: CANDIDATE_ID,
				decision: 'declined',
				decline_reason: 'incompatible religion',
			}),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as DecisionResponse

		// Assert
		expect(res.status).toBe(201)
		expect(json.decision).toBe('declined')
		expect(json.decline_reason).toBe('incompatible religion')
		expect(json.person_id).toBe(PERSON_ID)
		expect(json.candidate_id).toBe(CANDIDATE_ID)
		decisionResponseSchema.parse(json)
	})

	test('records an accepted decision', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({ id: PERSON_ID, matchmakerId: MM_USER }),
		])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: PERSON_ID,
				candidate_id: CANDIDATE_ID,
				decision: 'accepted',
			}),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as DecisionResponse

		// Assert
		expect(res.status).toBe(201)
		expect(json.decision).toBe('accepted')
		expect(json.decline_reason).toBeNull()
		decisionResponseSchema.parse(json)
	})

	test('returns 400 when required fields are missing', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ decision: 'declined' }),
		})
		let res = await app.fetch(req)

		// Assert
		expect(res.status).toBe(400)
	})

	test('returns 400 when decision enum value is invalid', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: PERSON_ID,
				candidate_id: CANDIDATE_ID,
				decision: 'maybe',
			}),
		})
		let res = await app.fetch(req)

		// Assert
		expect(res.status).toBe(400)
	})

	test('returns 404 when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				person_id: PERSON_ID,
				candidate_id: CANDIDATE_ID,
				decision: 'declined',
			}),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})

describe('GET /api/match-decisions/:personId', () => {
	test('lists all decisions for a person owned by the caller', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({ id: PERSON_ID, matchmakerId: MM_USER }),
		])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository([
			makeDecision({
				id: 'a50e8400-e29b-41d4-a716-446655440005',
				matchmakerId: MM_USER,
				personId: PERSON_ID,
				candidateId: CANDIDATE_ID,
				decision: 'declined',
				declineReason: 'age gap',
			}),
		])
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as DecisionResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(json).toHaveLength(1)
		expect(json[0]?.decision).toBe('declined')
	})

	test('returns empty array when the person has no decisions', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({ id: PERSON_ID, matchmakerId: MM_USER }),
		])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as DecisionResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(json).toHaveLength(0)
	})

	test('returns 404 when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as { error: string }

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})
