import type { IPersonRepository, Person } from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type ListPeopleForMatchmakerInput = {
	matchmakerId: string
}

export type ListPeopleForMatchmakerDeps = {
	personRepo: IPersonRepository
}

export class ListPeopleForMatchmaker
	implements UseCase<ListPeopleForMatchmakerInput, readonly Person[]>
{
	constructor(private deps: ListPeopleForMatchmakerDeps) {}

	async execute(
		input: ListPeopleForMatchmakerInput,
	): Promise<UseCaseResult<readonly Person[]>> {
		let people = await this.deps.personRepo.findByMatchmakerId(input.matchmakerId)
		return { ok: true, data: people }
	}
}
