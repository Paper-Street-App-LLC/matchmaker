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

	async execute(_input: CreateIntroductionInput): Promise<UseCaseResult<Introduction>> {
		throw new Error('CreateIntroductionUseCase.execute not implemented')
	}
}
