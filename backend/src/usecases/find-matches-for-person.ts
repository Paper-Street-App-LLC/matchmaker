import {
	AuthorizationService,
	type IMatchDecisionRepository,
	type IPersonRepository,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type MatchSuggestion = {
	readonly person: {
		readonly id: string
		readonly name: string
		readonly age: number | null
		readonly location: string | null
		readonly gender: string | null
	}
	readonly compatibility_score: number
	readonly match_explanation: string
	readonly is_cross_matchmaker: boolean
}

export type MatchFinderFn = (
	personId: string,
	matchmakerId: string,
	personRepo: IPersonRepository,
	matchDecisionRepo: IMatchDecisionRepository,
) => Promise<readonly MatchSuggestion[]>

export type FindMatchesForPersonInput = {
	matchmakerId: string
	personId: string
}

export type FindMatchesForPersonDeps = {
	personRepo: IPersonRepository
	matchDecisionRepo: IMatchDecisionRepository
	matchFinder: MatchFinderFn
}

export class FindMatchesForPerson
	implements UseCase<FindMatchesForPersonInput, readonly MatchSuggestion[]>
{
	constructor(private deps: FindMatchesForPersonDeps) {}

	async execute(
		_input: FindMatchesForPersonInput,
	): Promise<UseCaseResult<readonly MatchSuggestion[]>> {
		throw new Error('FindMatchesForPerson.execute not implemented')
	}
}
