import {
	AuthorizationService,
	IntroductionNotFoundError,
	InvalidIntroductionError,
	type IIntroductionRepository,
	type Introduction,
	type IntroductionStatus,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type UpdateIntroductionStatusInput = {
	userId: string
	introductionId: string
	status?: IntroductionStatus
	notes?: string | null
}

export type UpdateIntroductionStatusDeps = {
	introductionRepo: IIntroductionRepository
}

export class UpdateIntroductionStatus
	implements UseCase<UpdateIntroductionStatusInput, Introduction>
{
	constructor(private deps: UpdateIntroductionStatusDeps) {}

	async execute(
		_input: UpdateIntroductionStatusInput,
	): Promise<UseCaseResult<Introduction>> {
		throw new Error('UpdateIntroductionStatus.execute not implemented')
	}
}
