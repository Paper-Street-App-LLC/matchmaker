import type { IMatchDecisionRepository, IPersonRepository } from '@matchmaker/shared'
import type { MatchResponse } from '../schemas/matches'

// STUB — real implementation lands in the next commit (TDD red → green).
export let matchFinder = async (
	_personId: string,
	_matchmakerId: string,
	_personRepo: IPersonRepository,
	_matchDecisionRepo: IMatchDecisionRepository,
): Promise<MatchResponse[]> => {
	throw new Error('matchFinder: not implemented')
}
