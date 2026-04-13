import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { Introduction } from '@matchmaker/shared'
import type { SupabaseClient } from '../lib/supabase'
import {
	SupabaseIntroductionRepository,
	SupabasePersonRepository,
} from '../adapters/supabase'
import { createIntroductionSchema, updateIntroductionSchema } from '../schemas/introductions'
import { createIntroduction } from '../services/introductions'

type Variables = {
	userId: string
}

let introductionToResponse = (intro: Introduction) => ({
	id: intro.id,
	matchmaker_a_id: intro.matchmakerAId,
	matchmaker_b_id: intro.matchmakerBId,
	person_a_id: intro.personAId,
	person_b_id: intro.personBId,
	status: intro.status,
	notes: intro.notes,
	created_at: intro.createdAt.toISOString(),
	updated_at: intro.updatedAt.toISOString(),
})

export let createIntroductionsRoutes = (
	supabaseClient: SupabaseClient
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createIntroductionSchema), async c => {
		let userId = c.get('userId')
		let data = c.req.valid('json')

		let personRepo = new SupabasePersonRepository(supabaseClient)
		let introductionRepo = new SupabaseIntroductionRepository(supabaseClient)

		try {
			let result = await createIntroduction(personRepo, introductionRepo, {
				person_a_id: data.person_a_id,
				person_b_id: data.person_b_id,
				notes: data.notes,
				userId,
			})

			if (result.error) {
				return c.json({ error: result.error.message }, result.error.status)
			}

			return c.json(introductionToResponse(result.data), 201)
		} catch (err) {
			let message = err instanceof Error ? err.message : 'Failed to create introduction'
			return c.json({ error: message }, 500)
		}
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
