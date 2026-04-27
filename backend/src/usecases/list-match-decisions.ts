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
		input: ListMatchDecisionsInput,
	): Promise<UseCaseResult<readonly MatchDecision[]>> {
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

		let decisions = await this.deps.matchDecisionRepo.findByPerson(input.personId)
		return { ok: true, data: decisions }
	}
}
