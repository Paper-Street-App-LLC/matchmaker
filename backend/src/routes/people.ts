import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createPersonSchema, updatePersonSchema } from '../schemas/people'
import {
	fromCreatePersonRequestDTO,
	fromUpdatePersonRequestDTO,
	toPersonResponseDTO,
	useCaseErrorToHttp,
} from '../dto'
import type {
	CreatePerson,
	DeletePerson,
	GetPersonById,
	ListPeopleForMatchmaker,
	UpdatePerson,
} from '../usecases'

type Variables = {
	userId: string
}

export type PeopleRouteDeps = {
	createPerson: CreatePerson
	getPersonById: GetPersonById
	listPeopleForMatchmaker: ListPeopleForMatchmaker
	updatePerson: UpdatePerson
	deletePerson: DeletePerson
}

export let createPeopleRoutes = (
	deps: PeopleRouteDeps,
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createPersonSchema), async c => {
		let userId = c.get('userId')
		let body = c.req.valid('json')
		let input = fromCreatePersonRequestDTO(body, userId)
		let result = await deps.createPerson.execute(input)
		if (!result.ok) {
			let { status, body: errBody } = useCaseErrorToHttp(result.error)
			return c.json(errBody, status)
		}
		return c.json(toPersonResponseDTO(result.data), 201)
	})

	app.get('/', async c => {
		let userId = c.get('userId')
		let result = await deps.listPeopleForMatchmaker.execute({ matchmakerId: userId })
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error)
			return c.json(body, status)
		}
		return c.json(result.data.map(toPersonResponseDTO), 200)
	})

	let notFoundPerson = { not_found: 'Person not found' }

	app.get('/:id', async c => {
		let personId = c.req.param('id')
		let result = await deps.getPersonById.execute({ personId })
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error, notFoundPerson)
			return c.json(body, status)
		}
		return c.json(toPersonResponseDTO(result.data), 200)
	})

	app.put('/:id', zValidator('json', updatePersonSchema), async c => {
		let userId = c.get('userId')
		let personId = c.req.param('id')
		let body = c.req.valid('json')
		let input = fromUpdatePersonRequestDTO(body, userId, personId)
		let result = await deps.updatePerson.execute(input)
		if (!result.ok) {
			let { status, body: errBody } = useCaseErrorToHttp(result.error, notFoundPerson)
			return c.json(errBody, status)
		}
		return c.json(toPersonResponseDTO(result.data), 200)
	})

	app.delete('/:id', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('id')
		let result = await deps.deletePerson.execute({
			matchmakerId: userId,
			personId,
		})
		if (!result.ok) {
			let { status, body } = useCaseErrorToHttp(result.error, notFoundPerson)
			return c.json(body, status)
		}
		return c.json(toPersonResponseDTO(result.data), 200)
	})

	return app
}
