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
		_input: ListPeopleForMatchmakerInput,
	): Promise<UseCaseResult<readonly Person[]>> {
		throw new Error('ListPeopleForMatchmaker.execute not implemented')
	}
}
