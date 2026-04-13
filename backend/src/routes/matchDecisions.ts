import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createDecisionSchema } from '../schemas/matchDecisions'
import {
	fromCreateDecisionRequestDTO,
	toMatchDecisionResponseDTO,
	useCaseErrorToHttp,
} from '../dto'
import type { ListMatchDecisions, RecordMatchDecision } from '../usecases'

type Variables = {
	userId: string
}

export type MatchDecisionsRouteDeps = {
	recordMatchDecision: RecordMatchDecision
	listMatchDecisions: ListMatchDecisions
}

export let createMatchDecisionsRoutes = (
	deps: MatchDecisionsRouteDeps,
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createDecisionSchema), async c => {
		let userId = c.get('userId')
		let body = c.req.valid('json')
		let input = fromCreateDecisionRequestDTO(body, userId)
		let result = await deps.recordMatchDecision.execute(input)
		if (!result.ok) {
			let { status, body: errBody } = useCaseErrorToHttp(result.error)
			let friendly =
				result.error.code === 'not_found' ? { error: 'Person not found' } : errBody
			return c.json(friendly, status)
		}
		return c.json(toMatchDecisionResponseDTO(result.data), 201)
	})

	app.get('/:personId', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('personId')
		let result = await deps.listMatchDecisions.execute({
			matchmakerId: userId,
			personId,
		})
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error)
			let friendly = result.error.code === 'not_found' ? { error: 'Person not found' } : body
			return c.json(friendly, status)
		}
		return c.json(result.data.map(toMatchDecisionResponseDTO), 200)
	})

	return app
}
