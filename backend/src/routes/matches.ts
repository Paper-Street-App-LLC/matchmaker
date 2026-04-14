import { Hono } from 'hono'
import { toMatchSuggestionResponseDTO, useCaseErrorToHttp } from '../dto'
import type { FindMatchesForPerson } from '../usecases'

type Variables = {
	userId: string
}

export type MatchesRouteDeps = {
	findMatchesForPerson: FindMatchesForPerson
}

export let createMatchesRoutes = (
	deps: MatchesRouteDeps,
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	let notFoundPerson = { not_found: 'Person not found' }

	app.get('/:personId', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('personId')
		try {
			let result = await deps.findMatchesForPerson.execute({
				matchmakerId: userId,
				personId,
			})
			if (!result.ok) {
				let { status, body } = useCaseErrorToHttp(result.error, notFoundPerson)
				return c.json(body, status)
			}
			return c.json(result.data.map(toMatchSuggestionResponseDTO), 200)
		} catch (error) {
			// TODO(#77): global Hono onError so routes stay pure
			let message = error instanceof Error ? error.message : 'Failed to find matches'
			return c.json({ error: message }, 500)
		}
	})

	return app
}
