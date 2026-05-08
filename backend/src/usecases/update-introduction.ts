import {
	AuthorizationService,
	IntroductionNotFoundError,
	InvalidIntroductionError,
	type IIntroductionRepository,
	type Introduction,
	type IntroductionStatus,
} from '@matchmaker/shared'
import type { UseCase, UseCaseResult } from './types'

export type UpdateIntroductionInput = {
	matchmakerId: string
	introductionId: string
	status?: IntroductionStatus
	notes?: string | null
}

export type UpdateIntroductionDeps = {
	introductionRepo: IIntroductionRepository
}

export class UpdateIntroduction
	implements UseCase<UpdateIntroductionInput, Introduction>
{
	constructor(private deps: UpdateIntroductionDeps) {}

	async execute(
		input: UpdateIntroductionInput,
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

		let patch: { status?: IntroductionStatus; notes?: string | null } = {}
		if (input.status !== undefined) patch.status = input.status
		if (input.notes !== undefined) patch.notes = input.notes

		try {
			let updated = await this.deps.introductionRepo.update(input.introductionId, patch)
			return { ok: true, data: updated }
		} catch (error) {
			if (error instanceof IntroductionNotFoundError) {
				return {
					ok: false,
					error: {
						code: 'not_found',
						entity: 'introduction',
						message: `Introduction ${input.introductionId} not found`,
					},
				}
			}
			if (error instanceof InvalidIntroductionError) {
				return { ok: false, error: { code: 'unprocessable', message: error.message } }
			}
			throw error
		}
	}
}
