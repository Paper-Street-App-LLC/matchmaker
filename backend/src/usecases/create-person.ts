import type { IPersonRepository, Person } from '@matchmaker/shared'
import type { Clock, IdGenerator, UseCase, UseCaseResult } from './types'

export type CreatePersonInput = {
	matchmakerId: string
	name: string
	age?: number | null
	location?: string | null
	gender?: string | null
	preferences?: Record<string, unknown> | null
	personality?: Record<string, unknown> | null
	notes?: string | null
}

export type CreatePersonDeps = {
	personRepo: IPersonRepository
	clock: Clock
	ids: IdGenerator
}

export class CreatePerson implements UseCase<CreatePersonInput, Person> {
	constructor(private deps: CreatePersonDeps) {}

	async execute(_input: CreatePersonInput): Promise<UseCaseResult<Person>> {
		throw new Error('CreatePerson.execute not implemented')
	}
}
