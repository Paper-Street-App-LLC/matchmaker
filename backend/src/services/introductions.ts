import {
	AuthorizationService,
	createIntroduction as buildIntroduction,
	type IIntroductionRepository,
	type IPersonRepository,
	type Introduction,
} from '@matchmaker/shared'

type CreateIntroductionParams = {
	person_a_id: string
	person_b_id: string
	notes?: string | null
	userId: string
}

type IntroductionErrorStatus = 403 | 404 | 422 | 500

type IntroductionResult =
	| { data: Introduction; error: null }
	| { data: null; error: { message: string; status: IntroductionErrorStatus } }

export let createIntroduction = async (
	personRepo: IPersonRepository,
	introductionRepo: IIntroductionRepository,
	params: CreateIntroductionParams,
): Promise<IntroductionResult> => {
	let personA = await personRepo.findById(params.person_a_id)
	if (!personA) {
		return { data: null, error: { message: 'Person A not found', status: 404 } }
	}

	let personB = await personRepo.findById(params.person_b_id)
	if (!personB) {
		return { data: null, error: { message: 'Person B not found', status: 404 } }
	}

	if (!AuthorizationService.canMatchmakerCreateIntroduction(params.userId, personA, personB)) {
		return {
			data: null,
			error: {
				message: 'You must own at least one person in the introduction',
				status: 403,
			},
		}
	}

	// Introduction entity requires non-null matchmaker ids on both sides. Authorization above
	// guarantees at least one side is owned by the requester, but the other side could still
	// be an unassigned person — reject rather than fabricate a matchmaker id.
	if (personA.matchmakerId === null || personB.matchmakerId === null) {
		return {
			data: null,
			error: { message: 'Both people must belong to a matchmaker', status: 422 },
		}
	}

	let now = new Date()
	let intro = buildIntroduction({
		id: crypto.randomUUID(),
		matchmakerAId: personA.matchmakerId,
		matchmakerBId: personB.matchmakerId,
		personAId: personA.id,
		personBId: personB.id,
		notes: params.notes ?? null,
		createdAt: now,
		updatedAt: now,
	})

	let saved = await introductionRepo.create(intro)
	return { data: saved, error: null }
}
