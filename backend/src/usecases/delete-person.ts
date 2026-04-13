import {
	AuthorizationService,
	PersonNotFoundError,
	type IPersonRepository,
	type Person,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type DeletePersonInput = {
	matchmakerId: string
	personId: string
}

export type DeletePersonDeps = {
	personRepo: IPersonRepository
}

export class DeletePerson implements UseCase<DeletePersonInput, Person> {
	constructor(private deps: DeletePersonDeps) {}

	async execute(_input: DeletePersonInput): Promise<UseCaseResult<Person>> {
		throw new Error('DeletePerson.execute not implemented')
	}
}
