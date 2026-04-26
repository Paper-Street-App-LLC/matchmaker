import {
	AuthorizationService,
	InvalidIntroductionError,
	createIntroduction as buildIntroduction,
	type IIntroductionRepository,
	type IPersonRepository,
	type Introduction,
} from '@matchmaker/shared'
import type { Clock, IdGenerator, UseCase, UseCaseResult } from './types'

export type CreateIntroductionInput = {
	matchmakerId: string
	personAId: string
	personBId: string
	notes?: string | null
}

export type CreateIntroductionDeps = {
	personRepo: IPersonRepository
	introductionRepo: IIntroductionRepository
	clock: Clock
	ids: IdGenerator
}

export class CreateIntroduction implements UseCase<CreateIntroductionInput, Introduction> {
	constructor(private deps: CreateIntroductionDeps) {}

	async execute(input: CreateIntroductionInput): Promise<UseCaseResult<Introduction>> {
		let [personA, personB] = await Promise.all([
			this.deps.personRepo.findById(input.personAId),
			this.deps.personRepo.findById(input.personBId),
		])

		if (!personA) {
			return {
				ok: false,
				error: { code: 'not_found', entity: 'person', message: 'Person A not found' },
			}
		}
		if (!personB) {
			return {
				ok: false,
				error: { code: 'not_found', entity: 'person', message: 'Person B not found' },
			}
		}

		if (
			!AuthorizationService.canMatchmakerCreateIntroduction(
				input.matchmakerId,
				personA,
				personB,
			)
		) {
			return {
				ok: false,
				error: {
					code: 'forbidden',
					message: 'You must own at least one person in the introduction',
				},
			}
		}

		// Authorization above guarantees one side is owned by the requester, but the other side
		// could still be unassigned — reject rather than fabricate a matchmaker id.
		if (personA.matchmakerId === null || personB.matchmakerId === null) {
			return {
				ok: false,
				error: {
					code: 'unprocessable',
					message: 'Both people must belong to a matchmaker',
				},
			}
		}

		let now = this.deps.clock.now()
		try {
			let intro = buildIntroduction({
				id: this.deps.ids.newId(),
				matchmakerAId: personA.matchmakerId,
				matchmakerBId: personB.matchmakerId,
				personAId: personA.id,
				personBId: personB.id,
				notes: input.notes ?? null,
				createdAt: now,
				updatedAt: now,
			})
			let saved = await this.deps.introductionRepo.create(intro)
			return { ok: true, data: saved }
		} catch (error) {
			if (error instanceof InvalidIntroductionError) {
				return { ok: false, error: { code: 'unprocessable', message: error.message } }
			}
			throw error
		}
	}
}
