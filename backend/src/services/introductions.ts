import type { SupabaseClient } from '../lib/supabase'

type CreateIntroductionParams = {
	person_a_id: string
	person_b_id: string
	notes?: string | null
	userId: string
}

type IntroductionResult =
	| { data: Record<string, unknown>; error: null }
	| { data: null; error: { message: string; status: number } }

export let createIntroduction = async (
	supabaseClient: SupabaseClient,
	params: CreateIntroductionParams
): Promise<IntroductionResult> => {
	let { person_a_id, person_b_id, notes, userId } = params

	// Look up both people to get their matchmaker IDs
	let { data: personA, error: personAError } = await supabaseClient
		.from('people')
		.select('id, matchmaker_id')
		.eq('id', person_a_id)
		.single()

	if (personAError || !personA) {
		return { data: null, error: { message: 'Person A not found', status: 404 } }
	}

	let { data: personB, error: personBError } = await supabaseClient
		.from('people')
		.select('id, matchmaker_id')
		.eq('id', person_b_id)
		.single()

	if (personBError || !personB) {
		return { data: null, error: { message: 'Person B not found', status: 404 } }
	}

	// Validate the requesting user owns at least one of the people
	if (personA.matchmaker_id !== userId && personB.matchmaker_id !== userId) {
		return {
			data: null,
			error: { message: 'You must own at least one person in the introduction', status: 403 },
		}
	}

	let { data: introduction, error } = await supabaseClient
		.from('introductions')
		.insert({
			person_a_id,
			person_b_id,
			notes: notes || null,
			matchmaker_a_id: personA.matchmaker_id,
			matchmaker_b_id: personB.matchmaker_id,
		})
		.select()
		.single()

	if (error) {
		return { data: null, error: { message: error.message, status: 500 } }
	}

	return { data: introduction, error: null }
}
