import type { SupabaseClient } from '@supabase/supabase-js'

export type ToolResult = {
	content: string
	isError?: boolean
}

export let executeTool = async (
	supabaseClient: SupabaseClient,
	userId: string,
	toolName: string,
	toolArgs: Record<string, unknown>
): Promise<ToolResult> => {
	try {
		let result = await executeToolInner(supabaseClient, userId, toolName, toolArgs)
		return { content: JSON.stringify(result, null, 2) }
	} catch (error) {
		let message = error instanceof Error ? error.message : 'Unknown error'
		return { content: `Error: ${message}`, isError: true }
	}
}

let executeToolInner = async (
	supabaseClient: SupabaseClient,
	userId: string,
	toolName: string,
	args: Record<string, unknown>
): Promise<unknown> => {
	switch (toolName) {
		case 'add_person': {
			requireString(args, 'name')
			let { data, error } = await supabaseClient
				.from('people')
				.insert({ name: args.name, matchmaker_id: userId })
				.select()
				.single()
			if (error) throw new Error(error.message)
			return data
		}

		case 'list_people': {
			let { data, error } = await supabaseClient
				.from('people')
				.select('*')
				.eq('matchmaker_id', userId)
				.eq('active', true)
			if (error) throw new Error(error.message)
			return data
		}

		case 'get_person': {
			requireString(args, 'id')
			let { data, error } = await supabaseClient
				.from('people')
				.select('*')
				.eq('id', args.id)
				.eq('matchmaker_id', userId)
				.single()
			if (error) throw new Error(error.message)
			return data
		}

		case 'update_person': {
			requireString(args, 'id')
			let { id, ...updates } = args
			let { data, error } = await supabaseClient
				.from('people')
				.update(updates)
				.eq('id', id)
				.eq('matchmaker_id', userId)
				.select()
				.single()
			if (error) throw new Error(error.message)
			return data
		}

		case 'create_introduction': {
			requireString(args, 'person_a_id')
			requireString(args, 'person_b_id')
			return await createIntroduction(supabaseClient, userId, args as {
				person_a_id: string
				person_b_id: string
				notes?: string
			})
		}

		case 'list_introductions': {
			let { data, error } = await supabaseClient
				.from('introductions')
				.select('*')
				.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
			if (error) throw new Error(error.message)
			return data
		}

		case 'update_introduction': {
			requireString(args, 'id')
			let { id, ...updates } = args
			let { data, error } = await supabaseClient
				.from('introductions')
				.update(updates)
				.eq('id', id)
				.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
				.select()
				.maybeSingle()
			if (error) throw new Error(error.message)
			if (!data) throw new Error('Introduction not found')
			return data
		}

		case 'find_matches': {
			requireString(args, 'person_id')
			// Verify person belongs to this matchmaker
			let { data: person, error: personError } = await supabaseClient
				.from('people')
				.select('id')
				.eq('id', args.person_id)
				.eq('matchmaker_id', userId)
				.maybeSingle()
			if (personError) throw new Error(personError.message)
			if (!person) throw new Error('Person not found')

			// Fetch all active people (cross-matchmaker pool)
			let { data: allPeople, error: peopleError } = await supabaseClient
				.from('people')
				.select('*')
				.eq('active', true)
			if (peopleError) throw new Error(peopleError.message)

			// Fetch declined decisions to build exclusion set
			let { data: decisions, error: decisionsError } = await supabaseClient
				.from('match_decisions')
				.select('candidate_id')
				.eq('person_id', args.person_id)
				.eq('matchmaker_id', userId)
				.eq('decision', 'declined')
			if (decisionsError) throw new Error(decisionsError.message)

			let excludeIds = new Set(
				(decisions || []).map((d: { candidate_id: string }) => d.candidate_id)
			)

			let eligible = (allPeople || []).filter(
				(p: { id: string }) => !excludeIds.has(p.id) && p.id !== args.person_id
			)

			return eligible
		}

		case 'record_decision': {
			requireString(args, 'person_id')
			requireString(args, 'candidate_id')
			requireString(args, 'decision')
			if (args.decision !== 'accepted' && args.decision !== 'declined') {
				throw new Error("decision must be 'accepted' or 'declined'")
			}
			// Verify person belongs to this matchmaker
			let { data: person, error: personError } = await supabaseClient
				.from('people')
				.select('id')
				.eq('id', args.person_id)
				.eq('matchmaker_id', userId)
				.maybeSingle()
			if (personError) throw new Error(personError.message)
			if (!person) throw new Error('Person not found')

			let { data, error } = await supabaseClient
				.from('match_decisions')
				.insert({
					matchmaker_id: userId,
					person_id: args.person_id,
					candidate_id: args.candidate_id,
					decision: args.decision,
					decline_reason: (args.decline_reason as string) || null,
				})
				.select()
				.single()
			if (error) throw new Error(error.message)
			return data
		}

		case 'list_decisions': {
			requireString(args, 'person_id')
			// Verify person belongs to this matchmaker
			let { data: person, error: personError } = await supabaseClient
				.from('people')
				.select('id')
				.eq('id', args.person_id)
				.eq('matchmaker_id', userId)
				.maybeSingle()
			if (personError) throw new Error(personError.message)
			if (!person) throw new Error('Person not found')

			let { data, error } = await supabaseClient
				.from('match_decisions')
				.select('*')
				.eq('person_id', args.person_id)
				.eq('matchmaker_id', userId)
			if (error) throw new Error(error.message)
			return data
		}

		case 'delete_person': {
			requireString(args, 'id')
			let { data, error } = await supabaseClient
				.from('people')
				.update({ active: false })
				.eq('id', args.id)
				.eq('matchmaker_id', userId)
				.select()
				.single()
			if (error) throw new Error(error.message)
			return data
		}

		case 'get_introduction': {
			requireString(args, 'id')
			let { data, error } = await supabaseClient
				.from('introductions')
				.select('*')
				.eq('id', args.id)
				.or(`matchmaker_a_id.eq.${userId},matchmaker_b_id.eq.${userId}`)
				.maybeSingle()
			if (error) throw new Error(error.message)
			if (!data) throw new Error('Introduction not found')
			return data
		}

		case 'submit_feedback': {
			requireString(args, 'introduction_id')
			requireString(args, 'from_person_id')
			requireString(args, 'content')
			let { data, error } = await supabaseClient
				.from('feedback')
				.insert({
					introduction_id: args.introduction_id,
					from_person_id: args.from_person_id,
					content: args.content,
					sentiment: (args.sentiment as string) || null,
				})
				.select()
				.single()
			if (error) throw new Error(error.message)
			return data
		}

		case 'list_feedback': {
			requireString(args, 'introduction_id')
			let { data, error } = await supabaseClient
				.from('feedback')
				.select('*')
				.eq('introduction_id', args.introduction_id)
			if (error) throw new Error(error.message)
			return data
		}

		case 'get_feedback': {
			requireString(args, 'id')
			let { data, error } = await supabaseClient
				.from('feedback')
				.select('*')
				.eq('id', args.id)
				.single()
			if (error) throw new Error(error.message)
			return data
		}

		default:
			throw new Error(`Unknown tool: ${toolName}`)
	}
}

let requireString = (args: Record<string, unknown>, field: string): void => {
	if (!(field in args) || typeof args[field] !== 'string') {
		throw new Error(`Invalid arguments: ${field} is required and must be a string`)
	}
}

let createIntroduction = async (
	supabaseClient: SupabaseClient,
	userId: string,
	args: { person_a_id: string; person_b_id: string; notes?: string }
): Promise<unknown> => {
	// Look up both people to get their matchmaker IDs
	let { data: personA, error: personAError } = await supabaseClient
		.from('people')
		.select('id, matchmaker_id')
		.eq('id', args.person_a_id)
		.single()
	if (personAError || !personA) throw new Error('Person A not found')

	let { data: personB, error: personBError } = await supabaseClient
		.from('people')
		.select('id, matchmaker_id')
		.eq('id', args.person_b_id)
		.single()
	if (personBError || !personB) throw new Error('Person B not found')

	// Validate the requesting user owns at least one person
	if (personA.matchmaker_id !== userId && personB.matchmaker_id !== userId) {
		throw new Error('You must own at least one person in the introduction')
	}

	let { data, error } = await supabaseClient
		.from('introductions')
		.insert({
			person_a_id: args.person_a_id,
			person_b_id: args.person_b_id,
			notes: args.notes || null,
			matchmaker_a_id: personA.matchmaker_id,
			matchmaker_b_id: personB.matchmaker_id,
		})
		.select()
		.single()
	if (error) throw new Error(error.message)
	return data
}
