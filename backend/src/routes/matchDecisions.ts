import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '../lib/supabase'
import { createDecisionSchema } from '../schemas/matchDecisions'

type Variables = {
	userId: string
}

export let createMatchDecisionsRoutes = (
	supabaseClient: SupabaseClient
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createDecisionSchema), async c => {
		let userId = c.get('userId')
		let data = c.req.valid('json')

		// Verify person belongs to this matchmaker
		let { data: person, error: personError } = await supabaseClient
			.from('people')
			.select('id')
			.eq('id', data.person_id)
			.eq('matchmaker_id', userId)
			.maybeSingle()

		if (personError) {
			return c.json({ error: personError.message }, 500)
		}

		if (!person) {
			return c.json({ error: 'Person not found' }, 404)
		}

		let { data: decision, error } = await supabaseClient
			.from('match_decisions')
			.insert({
				matchmaker_id: userId,
				person_id: data.person_id,
				candidate_id: data.candidate_id,
				decision: data.decision,
				decline_reason: data.decline_reason || null,
			})
			.select()
			.single()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		return c.json(decision, 201)
	})

	app.get('/:personId', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('personId')

		// Verify person belongs to this matchmaker
		let { data: person, error: personError } = await supabaseClient
			.from('people')
			.select('id')
			.eq('id', personId)
			.eq('matchmaker_id', userId)
			.maybeSingle()

		if (personError) {
			return c.json({ error: personError.message }, 500)
		}

		if (!person) {
			return c.json({ error: 'Person not found' }, 404)
		}

		let { data: decisions, error } = await supabaseClient
			.from('match_decisions')
			.select('*')
			.eq('person_id', personId)
			.eq('matchmaker_id', userId)

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		return c.json(decisions || [], 200)
	})

	return app
}
