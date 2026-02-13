import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '../lib/supabase'
import { createIntroductionSchema, updateIntroductionSchema } from '../schemas/introductions'

type Variables = {
	userId: string
}

export let createIntroductionsRoutes = (
	supabaseClient: SupabaseClient
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createIntroductionSchema), async c => {
		let userId = c.get('userId')
		let data = c.req.valid('json')

		// Look up both people to get their matchmaker IDs
		let { data: personA, error: personAError } = await supabaseClient
			.from('people')
			.select('id, matchmaker_id')
			.eq('id', data.person_a_id)
			.single()

		if (personAError || !personA) {
			return c.json({ error: 'Person A not found' }, 404)
		}

		let { data: personB, error: personBError } = await supabaseClient
			.from('people')
			.select('id, matchmaker_id')
			.eq('id', data.person_b_id)
			.single()

		if (personBError || !personB) {
			return c.json({ error: 'Person B not found' }, 404)
		}

		// Validate the requesting user owns at least one of the people
		if (personA.matchmaker_id !== userId && personB.matchmaker_id !== userId) {
			return c.json({ error: 'You must own at least one person in the introduction' }, 403)
		}

		let { data: introduction, error } = await supabaseClient
			.from('introductions')
			.insert({
				person_a_id: data.person_a_id,
				person_b_id: data.person_b_id,
				notes: data.notes || null,
				matchmaker_a_id: personA.matchmaker_id,
				matchmaker_b_id: personB.matchmaker_id,
			})
			.select()
			.single()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		return c.json(introduction, 201)
	})

	app.get('/', async c => {
		let userId = c.get('userId')

		let { data: introductions, error } = await supabaseClient
			.from('introductions')
			.select('*')
			.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		return c.json(introductions || [], 200)
	})

	app.get('/:id', async c => {
		let userId = c.get('userId')
		let introductionId = c.req.param('id')

		let { data: introduction, error } = await supabaseClient
			.from('introductions')
			.select('*')
			.eq('id', introductionId)
			.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
			.maybeSingle()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		if (!introduction) {
			return c.json({ error: 'Introduction not found' }, 404)
		}

		return c.json(introduction, 200)
	})

	app.put('/:id', zValidator('json', updateIntroductionSchema), async c => {
		let userId = c.get('userId')
		let introductionId = c.req.param('id')
		let data = c.req.valid('json')

		let { data: introduction, error } = await supabaseClient
			.from('introductions')
			.update(data)
			.eq('id', introductionId)
			.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
			.select()
			.maybeSingle()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		if (!introduction) {
			return c.json({ error: 'Introduction not found' }, 404)
		}

		return c.json(introduction, 200)
	})

	return app
}
