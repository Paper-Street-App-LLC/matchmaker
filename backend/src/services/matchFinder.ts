import type { SupabaseClient } from '../lib/supabase'
import { findMatches } from './matchingAlgorithm'
import type { MatchResponse } from '../schemas/matches'

// Orchestrates match finding by fetching all active people (cross-matchmaker pool),
// excluding candidates the matchmaker has already reviewed, then running the algorithm.
export let matchFinder = async (
	personId: string,
	matchmakerId: string,
	supabaseClient: SupabaseClient
): Promise<MatchResponse[]> => {
	// Fetch ALL active people — seed profiles and all matchmakers' clients
	let { data: allPeople, error: peopleError } = await supabaseClient
		.from('people')
		.select('*')
		.eq('active', true)

	if (peopleError) {
		return []
	}

	// Fetch prior decisions to build the exclusion set
	let { data: decisions } = await supabaseClient
		.from('match_decisions')
		.select('candidate_id')
		.eq('person_id', personId)
		.eq('matchmaker_id', matchmakerId)

	let excludeIds = new Set<string>(
		(decisions || []).map((d: { candidate_id: string }) => d.candidate_id)
	)

	// Exclude already-reviewed candidates
	let eligiblePeople = (allPeople || []).filter(p => !excludeIds.has(p.id))

	return findMatches(personId, eligiblePeople)
}
