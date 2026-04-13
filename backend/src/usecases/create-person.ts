import {
	InvalidPersonError,
	createPerson,
	type IPersonRepository,
	type Person,
} from '@matchmaker/shared'
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

	async execute(input: CreatePersonInput): Promise<UseCaseResult<Person>> {
		let now = this.deps.clock.now()
		try {
			let person = createPerson({
				id: this.deps.ids.newId(),
				matchmakerId: input.matchmakerId,
				name: input.name,
				age: input.age ?? null,
				location: input.location ?? null,
				gender: input.gender ?? null,
				preferences: input.preferences ?? null,
				personality: input.personality ?? null,
				notes: input.notes ?? null,
				active: true,
				createdAt: now,
				updatedAt: now,
			})
			let saved = await this.deps.personRepo.create(person)
			return { ok: true, data: saved }
		} catch (error) {
			if (error instanceof InvalidPersonError) {
				return { ok: false, error: { code: 'unprocessable', message: error.message } }
			}
			throw error
		}
	}
}
