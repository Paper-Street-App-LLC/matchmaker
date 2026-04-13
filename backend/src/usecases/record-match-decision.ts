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

	async execute(_input: RecordMatchDecisionInput): Promise<UseCaseResult<MatchDecision>> {
		throw new Error('RecordMatchDecision.execute not implemented')
	}
}
