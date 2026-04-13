import {
	AuthorizationService,
	InvalidPersonError,
	PersonNotFoundError,
	type IPersonRepository,
	type Person,
	type PersonUpdate,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type UpdatePersonInput = {
	matchmakerId: string
	personId: string
	patch: PersonUpdate
}

export type UpdatePersonDeps = {
	personRepo: IPersonRepository
}

export class UpdatePerson implements UseCase<UpdatePersonInput, Person> {
	constructor(private deps: UpdatePersonDeps) {}

	async execute(_input: UpdatePersonInput): Promise<UseCaseResult<Person>> {
		throw new Error('UpdatePerson.execute not implemented')
	}
}
