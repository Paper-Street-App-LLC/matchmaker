import type { IPersonRepository, Person } from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type GetPersonByIdInput = {
	personId: string
}

export type GetPersonByIdDeps = {
	personRepo: IPersonRepository
}

// Cross-matchmaker by design: any active person is inspectable by id, mirroring
// the FindMatchesForPerson candidate pool. Soft-deleted (inactive) people are
// hidden as not_found.
export class GetPersonById implements UseCase<GetPersonByIdInput, Person> {
	constructor(private deps: GetPersonByIdDeps) {}

	async execute(input: GetPersonByIdInput): Promise<UseCaseResult<Person>> {
		let existing = await this.deps.personRepo.findById(input.personId)
		if (!existing || !existing.active) {
			return {
				ok: false,
				error: {
					code: 'not_found',
					entity: 'person',
					message: `Person ${input.personId} not found`,
				},
			}
		}
		return { ok: true, data: existing }
	}
}
