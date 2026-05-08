import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createFeedbackSchema } from '../schemas/feedback'
import {
	fromCreateFeedbackRequestDTO,
	toFeedbackResponseDTO,
	useCaseErrorToHttp,
} from '../dto'
import type { GetFeedback, ListFeedback, SubmitFeedback } from '../usecases'

type Variables = {
	userId: string
}

export type FeedbackRouteDeps = {
	submitFeedback: SubmitFeedback
	listFeedback: ListFeedback
	getFeedback: GetFeedback
}

let notFoundFeedback = { not_found: 'Feedback not found' }

export let createFeedbackRoutes = (
	deps: FeedbackRouteDeps,
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createFeedbackSchema), async c => {
		let body = c.req.valid('json')
		let input = fromCreateFeedbackRequestDTO(body)
		let result = await deps.submitFeedback.execute(input)
		if (!result.ok) {
			let { status, body: errBody } = useCaseErrorToHttp(result.error)
			return c.json(errBody, status)
		}
		return c.json(toFeedbackResponseDTO(result.data), 201)
	})

	app.get('/', async c => {
		let introductionId = c.req.query('introductionId')
		if (!introductionId) {
			return c.json({ error: 'introductionId query parameter required' }, 400)
		}
		let result = await deps.listFeedback.execute({ introductionId })
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error)
			return c.json(body, status)
		}
		return c.json(result.data.map(toFeedbackResponseDTO), 200)
	})

	app.get('/:id', async c => {
		let feedbackId = c.req.param('id')
		let result = await deps.getFeedback.execute({ feedbackId })
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error, notFoundFeedback)
			return c.json(body, status)
		}
		return c.json(toFeedbackResponseDTO(result.data), 200)
	})

	return app
}
