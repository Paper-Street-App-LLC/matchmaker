import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '../lib/supabase'
import { createMatchDecisionSchema } from '../schemas/matchDecisions'

type Variables = {
	userId: string
}

export let createMatchDecisionsRoutes = (
	supabaseClient: SupabaseClient
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	// Record a match decision (accept or decline a candidate for a person)
	app.post('/', zValidator('json', createMatchDecisionSchema), async c => {
		let userId = c.get('userId')
		let data = c.req.valid('json')

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

	// List all decisions for a specific person
	app.get('/:personId', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('personId')

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
