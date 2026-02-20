import { Hono } from 'hono'
import type { SupabaseClient } from '../lib/supabase'
import { matchFinder } from '../services/matchFinder'

type Variables = {
	userId: string
}

export let createMatchesRoutes = (
	supabaseClient: SupabaseClient
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.get('/:personId', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('personId')

		// Verify person exists and belongs to matchmaker
		let { data: person, error: personError } = await supabaseClient
			.from('people')
			.select('*')
			.eq('id', personId)
			.eq('matchmaker_id', userId)
			.maybeSingle()

		if (personError) {
			return c.json({ error: personError.message }, 500)
		}

		if (!person) {
			return c.json({ error: 'Person not found' }, 404)
		}

		let matches = await matchFinder(personId, userId, supabaseClient)

		return c.json(matches, 200)
	})

	return app
}
