import type {
	IMatchDecisionRepository,
	IPersonRepository,
	Person,
} from '@matchmaker/shared'
import { findMatches } from './matchingAlgorithm'
import type { MatchResponse } from '../schemas/matches'
import type { PersonResponse } from '../schemas/people'

// TODO(#71): remove once matchingAlgorithm accepts domain Person entities.
// This mapper only exists because findMatches still consumes the snake_case
// PersonResponse schema shape — a layer leak between the use case and the
// otherwise framework-free algorithmic core.
let toPersonResponse = (p: Person): PersonResponse => ({
	id: p.id,
	matchmaker_id: p.matchmakerId,
	name: p.name,
	age: p.age,
	location: p.location,
	gender: p.gender,
	preferences: p.preferences === null ? null : { ...p.preferences },
	personality: p.personality === null ? null : { ...p.personality },
	notes: p.notes,
	active: p.active,
	created_at: p.createdAt.toISOString(),
	updated_at: p.updatedAt.toISOString(),
})

// Orchestrates match finding by fetching all active people (cross-matchmaker pool),
// excluding candidates the matchmaker has already declined, then running the algorithm.
export let matchFinder = async (
	personId: string,
	matchmakerId: string,
	personRepo: IPersonRepository,
	matchDecisionRepo: IMatchDecisionRepository,
): Promise<MatchResponse[]> => {
	let allPeople = await personRepo.findAllActive()
	let decisions = await matchDecisionRepo.findByPerson(personId)

	let excludeIds = new Set<string>(
		decisions
			.filter(d => d.decision === 'declined' && d.matchmakerId === matchmakerId)
			.map(d => d.candidateId),
	)

	let eligible = allPeople.filter(p => !excludeIds.has(p.id)).map(toPersonResponse)
	return findMatches(personId, eligible)
}
