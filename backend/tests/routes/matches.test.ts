import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import { createMatchesRoutes, type MatchesRouteDeps } from '../../src/routes/matches'
import {
	InMemoryMatchDecisionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'
import { FindMatchesForPerson, type MatchFinderFn } from '../../src/usecases'
import { matchFinder as realMatchFinder } from '../../src/services/matchFinder'
import { makeDecision, makePerson } from '../usecases/fixtures'
import type { MatchResponse } from '../../src/schemas/matches'

type Variables = { userId: string }
type ErrorResponse = { error: string }

let MM_USER = '550e8400-e29b-41d4-a716-446655440000'
let PERSON_ID = '650e8400-e29b-41d4-a716-446655440001'
let OTHER_ID = '750e8400-e29b-41d4-a716-446655440002'
let THIRD_ID = '850e8400-e29b-41d4-a716-446655440003'

let buildDeps = (
	personRepo: InMemoryPersonRepository,
	matchDecisionRepo: InMemoryMatchDecisionRepository,
	matchFinder: MatchFinderFn = realMatchFinder,
): MatchesRouteDeps => ({
	findMatchesForPerson: new FindMatchesForPerson({
		personRepo,
		matchDecisionRepo,
		matchFinder,
	}),
})

let mountApp = (deps: MatchesRouteDeps, userId: string) => {
	let app = new Hono<{ Variables: Variables }>()
	app.use('*', async (c, next) => {
		c.set('userId', userId)
		await next()
	})
	app.route('/', createMatchesRoutes(deps))
	return app
}

describe('GET /api/matches/:personId', () => {
	test('returns match suggestions for a person', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({
				id: PERSON_ID,
				matchmakerId: MM_USER,
				name: 'John Doe',
				age: 30,
				location: 'NYC',
				gender: 'male',
			}),
			makePerson({
				id: OTHER_ID,
				matchmakerId: MM_USER,
				name: 'Jane Doe',
				age: 28,
				location: 'NYC',
				gender: 'female',
			}),
		])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as MatchResponse[]

		// Assert
		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(1)
		expect(json[0]).toMatchObject({
			person: {
				id: OTHER_ID,
				name: 'Jane Doe',
			},
			compatibility_score: expect.any(Number),
			match_explanation: expect.any(String),
		})
	})

	test('excludes previously declined candidates from results', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({
				id: PERSON_ID,
				matchmakerId: MM_USER,
				name: 'John Doe',
				age: 30,
				location: 'NYC',
				gender: 'male',
			}),
			makePerson({
				id: OTHER_ID,
				matchmakerId: MM_USER,
				name: 'Jane Doe',
				age: 28,
				location: 'NYC',
				gender: 'female',
			}),
			makePerson({
				id: THIRD_ID,
				matchmakerId: MM_USER,
				name: 'Sara Smith',
				age: 26,
				location: 'NYC',
				gender: 'female',
			}),
		])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository([
			makeDecision({
				id: 'd-1',
				matchmakerId: MM_USER,
				personId: PERSON_ID,
				candidateId: THIRD_ID,
				decision: 'declined',
				declineReason: 'not a fit',
			}),
		])
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as MatchResponse[]

		// Assert
		expect(res.status).toBe(200)
		let ids = json.map(m => m.person.id)
		expect(ids).toContain(OTHER_ID)
		expect(ids).not.toContain(THIRD_ID)
	})

	test('returns 500 when the matchFinder throws', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository([
			makePerson({ id: PERSON_ID, matchmakerId: MM_USER }),
		])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let exploding: MatchFinderFn = async () => {
			throw new Error('database connection failed')
		}
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo, exploding), MM_USER)

		// Act
		let res = await app.fetch(new Request(`http://localhost/${PERSON_ID}`))
		let json = (await res.json()) as ErrorResponse

		// Assert
		expect(res.status).toBe(500)
		expect(json.error).toBe('database connection failed')
	})

	test('returns 404 when the person does not exist', async () => {
		// Arrange
		let personRepo = new InMemoryPersonRepository()
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()
		let app = mountApp(buildDeps(personRepo, matchDecisionRepo), MM_USER)

		// Act
		let res = await app.fetch(new Request('http://localhost/nonexistent-id'))
		let json = (await res.json()) as ErrorResponse

		// Assert
		expect(res.status).toBe(404)
		expect(json.error).toBe('Person not found')
	})
})
