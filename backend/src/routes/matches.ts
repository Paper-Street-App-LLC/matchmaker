import { Hono } from 'hono'
import type { SupabaseClient } from '../lib/supabase'
import { findMatches } from '../services/matchingAlgorithm'

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

		// Get all active people for the matchmaker
		let { data: allPeople, error: peopleError } = await supabaseClient
			.from('people')
			.select('*')
			.eq('matchmaker_id', userId)
			.eq('active', true)

		if (peopleError) {
			return c.json({ error: peopleError.message }, 500)
		}

		// Find matches using the algorithm
		let matches = findMatches(personId, allPeople || [])

		return c.json(matches, 200)
	})

	return app
}
