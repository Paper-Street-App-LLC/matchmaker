import type { IIntroductionRepository, Introduction } from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type ListIntroductionsForMatchmakerInput = {
	matchmakerId: string
}

export type ListIntroductionsForMatchmakerDeps = {
	introductionRepo: IIntroductionRepository
}

export class ListIntroductionsForMatchmaker
	implements UseCase<ListIntroductionsForMatchmakerInput, readonly Introduction[]>
{
	constructor(private deps: ListIntroductionsForMatchmakerDeps) {}

	async execute(
		input: ListIntroductionsForMatchmakerInput,
	): Promise<UseCaseResult<readonly Introduction[]>> {
		let introductions = await this.deps.introductionRepo.findByMatchmaker(
			input.matchmakerId,
		)
		return { ok: true, data: introductions }
	}
}
