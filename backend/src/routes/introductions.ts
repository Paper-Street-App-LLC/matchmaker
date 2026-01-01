import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '../lib/supabase'
import {
	createIntroductionSchema,
	updateIntroductionSchema,
} from '../schemas/introductions'

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

		let { data: introduction, error } = await supabaseClient
			.from('introductions')
			.insert({
				...data,
				matchmaker_id: userId,
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
			.eq('matchmaker_id', userId)

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
			.eq('matchmaker_id', userId)
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
			.eq('matchmaker_id', userId)
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
