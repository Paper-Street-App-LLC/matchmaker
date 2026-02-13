import { Hono } from 'hono'
import type { SupabaseClient } from '../lib/supabase'
import { findMatches } from '../services/matchingAlgorithm'
import type { DeclineReason } from '../services/matchingAlgorithm'

type Variables = {
	userId: string
}

let DEFAULT_MATCH_LIMIT = 3

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

		// Get ALL active people across all matchmakers (excluding the subject)
		let { data: allPeople, error: peopleError } = await supabaseClient
			.from('people')
			.select('*')
			.eq('active', true)
			.neq('id', personId)

		if (peopleError) {
			return c.json({ error: peopleError.message }, 500)
		}

		// Get previous match decisions to exclude already-decided candidates
		let { data: decisions, error: decisionsError } = await supabaseClient
			.from('match_decisions')
			.select('candidate_id, decision, decline_reason')
			.eq('person_id', personId)
			.eq('matchmaker_id', userId)

		if (decisionsError) {
			return c.json({ error: decisionsError.message }, 500)
		}

		// Get existing introductions to exclude already-introduced candidates
		let { data: introductions, error: introError } = await supabaseClient
			.from('introductions')
			.select('person_a_id, person_b_id')
			.or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`)

		if (introError) {
			return c.json({ error: introError.message }, 500)
		}

		// Build exclude set from decisions + introductions
		let excludeIds = new Set<string>()
		for (let d of decisions || []) {
			excludeIds.add(d.candidate_id)
		}
		for (let intro of introductions || []) {
			let otherId = intro.person_a_id === personId ? intro.person_b_id : intro.person_a_id
			excludeIds.add(otherId)
		}

		// Collect decline reasons as revealed preferences
		let declineReasons: DeclineReason[] = (decisions || [])
			.filter(d => d.decision === 'declined' && d.decline_reason)
			.map(d => ({
				candidateId: d.candidate_id,
				reason: d.decline_reason!,
			}))

		// Find matches using the algorithm with options
		let matches = findMatches(person, allPeople || [], userId, {
			excludeIds,
			declineReasons,
			limit: DEFAULT_MATCH_LIMIT,
		})

		return c.json(matches, 200)
	})

	return app
}
