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

	async execute(input: DeletePersonInput): Promise<UseCaseResult<Person>> {
		let existing = await this.deps.personRepo.findById(input.personId)
		if (!existing) {
			return {
				ok: false,
				error: {
					code: 'not_found',
					entity: 'person',
					message: `Person ${input.personId} not found`,
				},
			}
		}

		if (!AuthorizationService.canMatchmakerAccessPerson(input.matchmakerId, existing)) {
			return {
				ok: false,
				error: { code: 'forbidden', message: 'You do not own this person' },
			}
		}

		try {
			let deactivated = await this.deps.personRepo.update(input.personId, { active: false })
			return { ok: true, data: deactivated }
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
			throw error
		}
	}
}
