import {
	AuthorizationService,
	InvalidMatchDecisionError,
	RepositoryConflictError,
	createMatchDecision,
	type Decision,
	type IMatchDecisionRepository,
	type IPersonRepository,
	type MatchDecision,
} from '@matchmaker/shared'
import type { Clock, IdGenerator, UseCase, UseCaseResult } from './types'

export type RecordMatchDecisionInput = {
	matchmakerId: string
	personId: string
	candidateId: string
	decision: Decision
	declineReason?: string | null
}

export type RecordMatchDecisionDeps = {
	personRepo: IPersonRepository
	matchDecisionRepo: IMatchDecisionRepository
	clock: Clock
	ids: IdGenerator
}

export class RecordMatchDecision
	implements UseCase<RecordMatchDecisionInput, MatchDecision>
{
	constructor(private deps: RecordMatchDecisionDeps) {}

	async execute(input: RecordMatchDecisionInput): Promise<UseCaseResult<MatchDecision>> {
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

		if (!AuthorizationService.canMatchmakerRecordDecision(input.matchmakerId, person)) {
			return {
				ok: false,
				error: { code: 'forbidden', message: 'You do not own this person' },
			}
		}

		let decision: MatchDecision
		try {
			decision = createMatchDecision({
				id: this.deps.ids.newId(),
				matchmakerId: input.matchmakerId,
				personId: input.personId,
				candidateId: input.candidateId,
				decision: input.decision,
				declineReason: input.declineReason ?? null,
				createdAt: this.deps.clock.now(),
			})
		} catch (error) {
			if (error instanceof InvalidMatchDecisionError) {
				return { ok: false, error: { code: 'unprocessable', message: error.message } }
			}
			throw error
		}

		try {
			let saved = await this.deps.matchDecisionRepo.create(decision)
			return { ok: true, data: saved }
		} catch (error) {
			if (error instanceof RepositoryConflictError) {
				return { ok: false, error: { code: 'conflict', message: error.message } }
			}
			throw error
		}
	}
}
