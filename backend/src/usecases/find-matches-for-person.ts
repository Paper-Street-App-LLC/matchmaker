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
		input: FindMatchesForPersonInput,
	): Promise<UseCaseResult<readonly MatchSuggestion[]>> {
		let person = await this.deps.personRepo.findById(input.personId)
		if (!person) {
			return {
				ok: false,
				error: {
					code: 'not_found',
					entity: 'person',
					message: `Person ${input.personId} not found`,
				},
			}
		}

		if (!AuthorizationService.canMatchmakerAccessPerson(input.matchmakerId, person)) {
			return {
				ok: false,
				error: { code: 'forbidden', message: 'You do not own this person' },
			}
		}

		let suggestions = await this.deps.matchFinder(
			input.personId,
			input.matchmakerId,
			this.deps.personRepo,
			this.deps.matchDecisionRepo,
		)
		return { ok: true, data: suggestions }
	}
}
