import {
	AuthorizationService,
	type IMatchDecisionRepository,
	type IPersonRepository,
	type MatchDecision,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type ListMatchDecisionsInput = {
	matchmakerId: string
	personId: string
}

export type ListMatchDecisionsDeps = {
	personRepo: IPersonRepository
	matchDecisionRepo: IMatchDecisionRepository
}

export class ListMatchDecisions
	implements UseCase<ListMatchDecisionsInput, readonly MatchDecision[]>
{
	constructor(private deps: ListMatchDecisionsDeps) {}

	async execute(
		_input: ListMatchDecisionsInput,
	): Promise<UseCaseResult<readonly MatchDecision[]>> {
		throw new Error('ListMatchDecisions.execute not implemented')
	}
}
