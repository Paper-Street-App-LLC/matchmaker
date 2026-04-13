import type { IIntroductionRepository, IPersonRepository, Introduction } from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type CreateIntroductionInput = {
	userId: string
	personAId: string
	personBId: string
	notes?: string | null
}

export type CreateIntroductionServiceParams = {
	person_a_id: string
	person_b_id: string
	notes?: string | null
	userId: string
}

export type CreateIntroductionServiceResult =
	| { data: Introduction; error: null }
	| { data: null; error: { message: string; status: 403 | 404 | 422 | 500 } }

export type CreateIntroductionServiceFn = (
	personRepo: IPersonRepository,
	introductionRepo: IIntroductionRepository,
	params: CreateIntroductionServiceParams,
) => Promise<CreateIntroductionServiceResult>

export type CreateIntroductionDeps = {
	personRepo: IPersonRepository
	introductionRepo: IIntroductionRepository
	createIntroductionService: CreateIntroductionServiceFn
}

export class CreateIntroduction implements UseCase<CreateIntroductionInput, Introduction> {
	constructor(private deps: CreateIntroductionDeps) {}

	async execute(input: CreateIntroductionInput): Promise<UseCaseResult<Introduction>> {
		let serviceResult = await this.deps.createIntroductionService(
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
