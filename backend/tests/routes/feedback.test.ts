import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import { createFeedbackRoutes, type FeedbackRouteDeps } from '../../src/routes/feedback'
import { InMemoryFeedbackRepository } from '../fakes/in-memory-repositories'
import { GetFeedback, ListFeedback, SubmitFeedback } from '../../src/usecases'
import { fixedClock, fixedIds, makeFeedback } from '../usecases/fixtures'
import { feedbackResponseSchema, type FeedbackResponse } from '../../src/schemas/feedback'

type Variables = { userId: string }

let MATCHMAKER_ID = '550e8400-e29b-41d4-a716-446655440000'
let INTRODUCTION_ID = '750e8400-e29b-41d4-a716-446655440002'
let FROM_PERSON_ID = '850e8400-e29b-41d4-a716-446655440003'
let NEW_FEEDBACK_ID = '650e8400-e29b-41d4-a716-446655440001'

let buildDeps = (
	feedbackRepo: InMemoryFeedbackRepository,
	idQueue: readonly string[] = [NEW_FEEDBACK_ID],
): FeedbackRouteDeps => ({
	submitFeedback: new SubmitFeedback({
		feedbackRepo,
		clock: fixedClock(),
		ids: fixedIds(idQueue),
	}),
	listFeedback: new ListFeedback({ feedbackRepo }),
	getFeedback: new GetFeedback({ feedbackRepo }),
})

let mountApp = (deps: FeedbackRouteDeps): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()
	app.use('*', async (c, next) => {
		c.set('userId', MATCHMAKER_ID)
		await next()
	})
	app.route('/', createFeedbackRoutes(deps))
	return app
}

describe('POST /api/feedback', () => {
	test('creates feedback and returns the snake_case response', async () => {
		// Arrange
		let feedbackRepo = new InMemoryFeedbackRepository()
		let app = mountApp(buildDeps(feedbackRepo))

		// Act
		let req = new Request('http://localhost/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				introduction_id: INTRODUCTION_ID,
				from_person_id: FROM_PERSON_ID,
				content: 'Had a great time!',
				sentiment: 'positive',
			}),
		})
		let res = await app.fetch(req)
		let json = (await res.json()) as FeedbackResponse

		// Assert
		expect(res.status).toBe(201)
		expect(json.id).toBe(NEW_FEEDBACK_ID)
		expect(json.content).toBe('Had a great time!')
		expect(json.sentiment).toBe('positive')
		expect(json.introduction_id).toBe(INTRODUCTION_ID)
		expect(json.from_person_id).toBe(FROM_PERSON_ID)
		feedbackResponseSchema.parse(json)
	})

	test('rejects requests missing required fields with 400', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository()
		let app = mountApp(buildDeps(feedbackRepo))

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
	test('returns the feedback list for the introduction', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository([
			makeFeedback({
				id: 'fb-1',
				introductionId: INTRODUCTION_ID,
				content: 'Great date!',
				sentiment: 'positive',
			}),
			makeFeedback({
				id: 'fb-2',
				introductionId: INTRODUCTION_ID,
				content: 'Not a good match',
				sentiment: 'negative',
			}),
		])
		let app = mountApp(buildDeps(feedbackRepo))

		let req = new Request(`http://localhost/?introductionId=${INTRODUCTION_ID}`)
		let res = await app.fetch(req)
		let json = (await res.json()) as FeedbackResponse[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(2)
		expect(json[0]?.content).toBe('Great date!')
		expect(json[1]?.sentiment).toBe('negative')
	})

	test('returns an empty list when the introduction has no feedback', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository()
		let app = mountApp(buildDeps(feedbackRepo))

		let req = new Request('http://localhost/?introductionId=intro-empty')
		let res = await app.fetch(req)
		let json = (await res.json()) as FeedbackResponse[]

		expect(res.status).toBe(200)
		expect(Array.isArray(json)).toBe(true)
		expect(json).toHaveLength(0)
	})

	test('returns 400 when introductionId query param is missing', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository()
		let app = mountApp(buildDeps(feedbackRepo))

		let req = new Request('http://localhost/')
		let res = await app.fetch(req)

		expect(res.status).toBe(400)
	})
})

describe('GET /api/feedback/:id', () => {
	test('returns feedback by id', async () => {
		let feedbackId = 'b50e8400-e29b-41d4-a716-446655440099'
		let existing = makeFeedback({
			id: feedbackId,
			introductionId: INTRODUCTION_ID,
			fromPersonId: FROM_PERSON_ID,
			content: 'It was okay',
			sentiment: 'neutral',
		})
		let feedbackRepo = new InMemoryFeedbackRepository([existing])
		let app = mountApp(buildDeps(feedbackRepo))

		let req = new Request(`http://localhost/${feedbackId}`)
		let res = await app.fetch(req)
		let json = (await res.json()) as FeedbackResponse

		expect(res.status).toBe(200)
		expect(json.id).toBe(feedbackId)
		expect(json.content).toBe('It was okay')
		expect(json.sentiment).toBe('neutral')
		feedbackResponseSchema.parse(json)
	})

	test('returns 404 when feedback is not found', async () => {
		let feedbackRepo = new InMemoryFeedbackRepository()
		let app = mountApp(buildDeps(feedbackRepo))

		let req = new Request('http://localhost/nonexistent-id')
		let res = await app.fetch(req)
		let json = (await res.json()) as { error: string }

		expect(res.status).toBe(404)
		expect(json.error).toBe('Feedback not found')
	})
})
