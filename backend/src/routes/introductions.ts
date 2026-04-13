import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
	createIntroductionSchema,
	updateIntroductionSchema,
} from '../schemas/introductions'
import {
	fromCreateIntroductionRequestDTO,
	fromUpdateIntroductionRequestDTO,
	toIntroductionResponseDTO,
	useCaseErrorToHttp,
} from '../dto'
import type {
	CreateIntroduction,
	GetIntroductionById,
	ListIntroductionsForMatchmaker,
	UpdateIntroductionStatus,
} from '../usecases'

type Variables = {
	userId: string
}

export type IntroductionsRouteDeps = {
	createIntroduction: CreateIntroduction
	getIntroductionById: GetIntroductionById
	listIntroductionsForMatchmaker: ListIntroductionsForMatchmaker
	updateIntroductionStatus: UpdateIntroductionStatus
}

export let createIntroductionsRoutes = (
	deps: IntroductionsRouteDeps,
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createIntroductionSchema), async c => {
		let userId = c.get('userId')
		let body = c.req.valid('json')
		let input = fromCreateIntroductionRequestDTO(body, userId)
		let result = await deps.createIntroduction.execute(input)
		if (!result.ok) {
			let { status, body: errBody } = useCaseErrorToHttp(result.error)
			return c.json(errBody, status)
		}
		return c.json(toIntroductionResponseDTO(result.data), 201)
	})

	app.get('/', async c => {
		let userId = c.get('userId')
		let result = await deps.listIntroductionsForMatchmaker.execute({
			matchmakerId: userId,
		})
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error)
			return c.json(body, status)
		}
		return c.json(result.data.map(toIntroductionResponseDTO), 200)
	})

	app.get('/:id', async c => {
		let userId = c.get('userId')
		let introductionId = c.req.param('id')
		let result = await deps.getIntroductionById.execute({
			matchmakerId: userId,
			introductionId,
		})
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error)
			let friendly =
				result.error.code === 'not_found' ? { error: 'Introduction not found' } : body
			return c.json(friendly, status)
		}
		return c.json(toIntroductionResponseDTO(result.data), 200)
	})

	app.put('/:id', zValidator('json', updateIntroductionSchema), async c => {
		let userId = c.get('userId')
		let introductionId = c.req.param('id')
		let body = c.req.valid('json')
		let input = fromUpdateIntroductionRequestDTO(body, userId, introductionId)
		let result = await deps.updateIntroductionStatus.execute(input)
		if (!result.ok) {
			let { status, body: errBody } = useCaseErrorToHttp(result.error)
			let friendly =
				result.error.code === 'not_found' ? { error: 'Introduction not found' } : errBody
			return c.json(friendly, status)
		}
		return c.json(toIntroductionResponseDTO(result.data), 200)
	})

	return app
}
