import type { IIntroductionRepository, IPersonRepository, Introduction } from '@matchmaker/shared'
import { createIntroduction as createIntroductionService } from '../services/introductions'
import type { UseCase, UseCaseResult } from './types'

export type CreateIntroductionInput = {
	userId: string
	personAId: string
	personBId: string
	notes?: string | null
}

export type CreateIntroductionDeps = {
	personRepo: IPersonRepository
	introductionRepo: IIntroductionRepository
}

export class CreateIntroductionUseCase
	implements UseCase<CreateIntroductionInput, Introduction>
{
	constructor(private deps: CreateIntroductionDeps) {}

	async execute(input: CreateIntroductionInput): Promise<UseCaseResult<Introduction>> {
		let serviceResult = await createIntroductionService(
			this.deps.personRepo,
			this.deps.introductionRepo,
			{
				person_a_id: input.personAId,
				person_b_id: input.personBId,
				notes: input.notes ?? null,
				userId: input.userId,
			},
		)

		if (serviceResult.error === null) {
			return { ok: true, data: serviceResult.data }
		}

		let { message, status } = serviceResult.error
		if (status === 404) {
			return { ok: false, error: { code: 'not_found', entity: 'person', message } }
		}
		if (status === 403) {
			return { ok: false, error: { code: 'forbidden', message } }
		}
		if (status === 422) {
			return { ok: false, error: { code: 'unprocessable', message } }
		}
		throw new Error(`createIntroduction service failed unexpectedly: ${message}`)
	}
}
