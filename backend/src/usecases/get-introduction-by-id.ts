import {
	AuthorizationService,
	type IIntroductionRepository,
	type Introduction,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type GetIntroductionByIdInput = {
	matchmakerId: string
	introductionId: string
}

export type GetIntroductionByIdDeps = {
	introductionRepo: IIntroductionRepository
}

export class GetIntroductionById
	implements UseCase<GetIntroductionByIdInput, Introduction>
{
	constructor(private deps: GetIntroductionByIdDeps) {}

	async execute(
		input: GetIntroductionByIdInput,
	): Promise<UseCaseResult<Introduction>> {
		let existing = await this.deps.introductionRepo.findById(input.introductionId)
		if (!existing) {
			return {
				ok: false,
				error: {
					code: 'not_found',
					entity: 'introduction',
					message: `Introduction ${input.introductionId} not found`,
				},
			}
		}

		if (!AuthorizationService.canMatchmakerEditIntroduction(input.matchmakerId, existing)) {
			return {
				ok: false,
				error: { code: 'forbidden', message: 'You do not own this introduction' },
			}
		}

		return { ok: true, data: existing }
	}
}
