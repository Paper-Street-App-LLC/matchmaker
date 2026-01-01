import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '../lib/supabase'
import { createPersonSchema, updatePersonSchema } from '../schemas/people'

type Variables = {
	userId: string
}

export let createPeopleRoutes = (
	supabaseClient: SupabaseClient
): Hono<{ Variables: Variables }> => {
	let app = new Hono<{ Variables: Variables }>()

	app.post('/', zValidator('json', createPersonSchema), async c => {
		let userId = c.get('userId')
		let data = c.req.valid('json')

		let { data: person, error } = await supabaseClient
			.from('people')
			.insert({
				...data,
				matchmaker_id: userId,
			})
			.select()
			.single()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		return c.json(person, 201)
	})

	app.get('/', async c => {
		let userId = c.get('userId')

		let { data: people, error } = await supabaseClient
			.from('people')
			.select('*')
			.eq('matchmaker_id', userId)

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		return c.json(people || [], 200)
	})

	app.get('/:id', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('id')

		let { data: person, error } = await supabaseClient
			.from('people')
			.select('*')
			.eq('id', personId)
			.eq('matchmaker_id', userId)
			.maybeSingle()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		if (!person) {
			return c.json({ error: 'Person not found' }, 404)
		}

		return c.json(person, 200)
	})

	app.put('/:id', zValidator('json', updatePersonSchema), async c => {
		let userId = c.get('userId')
		let personId = c.req.param('id')
		let data = c.req.valid('json')

		let { data: person, error } = await supabaseClient
			.from('people')
			.update(data)
			.eq('id', personId)
			.eq('matchmaker_id', userId)
			.select()
			.maybeSingle()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		if (!person) {
			return c.json({ error: 'Person not found' }, 404)
		}

		return c.json(person, 200)
	})

	app.delete('/:id', async c => {
		let userId = c.get('userId')
		let personId = c.req.param('id')

		let { data: person, error } = await supabaseClient
			.from('people')
			.update({ active: false })
			.eq('id', personId)
			.eq('matchmaker_id', userId)
			.select()
			.maybeSingle()

		if (error) {
			return c.json({ error: error.message }, 500)
		}

		if (!person) {
			return c.json({ error: 'Person not found' }, 404)
		}

		return c.json(person, 200)
	})

	return app
}
