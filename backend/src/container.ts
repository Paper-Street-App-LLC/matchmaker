import {
	SupabaseIntroductionRepository,
	SupabaseMatchDecisionRepository,
	SupabasePersonRepository,
} from './adapters/supabase/index.js'
import type { SupabaseClient } from './lib/supabase.js'
import { matchFinder } from './services/matchFinder.js'
import {
	CreateIntroduction,
	CreatePerson,
	DeletePerson,
	FindMatchesForPerson,
	ListMatchDecisions,
	ListPeopleForMatchmaker,
	RecordMatchDecision,
	UpdateIntroductionStatus,
	UpdatePerson,
	systemClock,
	uuidGenerator,
	type Clock,
	type IdGenerator,
} from './usecases/index.js'

export interface UseCases {
	createPerson: CreatePerson
	updatePerson: UpdatePerson
	deletePerson: DeletePerson
	listPeopleForMatchmaker: ListPeopleForMatchmaker
	findMatchesForPerson: FindMatchesForPerson
	createIntroduction: CreateIntroduction
	updateIntroductionStatus: UpdateIntroductionStatus
	recordMatchDecision: RecordMatchDecision
	listMatchDecisions: ListMatchDecisions
}

export type ContainerOverrides = {
	clock?: Clock
	ids?: IdGenerator
}

export let buildContainer = (
	supabase: SupabaseClient,
	overrides: ContainerOverrides = {},
): UseCases => {
	let clock = overrides.clock ?? systemClock
	let ids = overrides.ids ?? uuidGenerator

	let personRepo = new SupabasePersonRepository(supabase)
	let introductionRepo = new SupabaseIntroductionRepository(supabase)
	let matchDecisionRepo = new SupabaseMatchDecisionRepository(supabase)

	let usecases: UseCases = {
		createPerson: new CreatePerson({ personRepo, clock, ids }),
		updatePerson: new UpdatePerson({ personRepo }),
		deletePerson: new DeletePerson({ personRepo }),
		listPeopleForMatchmaker: new ListPeopleForMatchmaker({ personRepo }),
		findMatchesForPerson: new FindMatchesForPerson({
			personRepo,
			matchDecisionRepo,
			matchFinder,
		}),
		createIntroduction: new CreateIntroduction({ personRepo, introductionRepo }),
		updateIntroductionStatus: new UpdateIntroductionStatus({ introductionRepo }),
		recordMatchDecision: new RecordMatchDecision({
			personRepo,
			matchDecisionRepo,
			clock,
			ids,
		}),
		listMatchDecisions: new ListMatchDecisions({ personRepo, matchDecisionRepo }),
	}

	return Object.freeze(usecases)
}
