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

	async execute(input: UpdatePersonInput): Promise<UseCaseResult<Person>> {
		let existing = await this.deps.personRepo.findById(input.personId)
		if (!existing) {
			return {
				ok: false,
				error: { code: 'not_found', entity: 'person', message: `Person ${input.personId} not found` },
			}
		}

		if (!AuthorizationService.canMatchmakerAccessPerson(input.matchmakerId, existing)) {
			return {
				ok: false,
				error: { code: 'forbidden', message: 'You do not own this person' },
			}
		}

		try {
			let updated = await this.deps.personRepo.update(input.personId, input.patch)
			return { ok: true, data: updated }
		} catch (error) {
			if (error instanceof PersonNotFoundError) {
				return {
					ok: false,
					error: {
						code: 'not_found',
						entity: 'person',
						message: `Person ${input.personId} not found`,
					},
				}
			}
			if (error instanceof InvalidPersonError) {
				return { ok: false, error: { code: 'unprocessable', message: error.message } }
			}
			throw error
		}
	}
}
