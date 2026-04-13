import {
	AuthorizationService,
	type IPersonRepository,
	type Person,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type GetPersonByIdInput = {
	matchmakerId: string
	personId: string
}

export type GetPersonByIdDeps = {
	personRepo: IPersonRepository
}

export class GetPersonById implements UseCase<GetPersonByIdInput, Person> {
	constructor(private deps: GetPersonByIdDeps) {}

	async execute(input: GetPersonByIdInput): Promise<UseCaseResult<Person>> {
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

		return { ok: true, data: existing }
	}
}
