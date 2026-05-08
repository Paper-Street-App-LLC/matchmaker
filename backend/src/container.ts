import {
	SupabaseFeedbackRepository,
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
	GetFeedback,
	GetIntroductionById,
	GetPersonById,
	ListFeedback,
	ListIntroductionsForMatchmaker,
	ListMatchDecisions,
	ListPeopleForMatchmaker,
	RecordMatchDecision,
	SubmitFeedback,
	UpdateIntroduction,
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
	getPersonById: GetPersonById
	listPeopleForMatchmaker: ListPeopleForMatchmaker
	findMatchesForPerson: FindMatchesForPerson
	createIntroduction: CreateIntroduction
	getIntroductionById: GetIntroductionById
	listIntroductionsForMatchmaker: ListIntroductionsForMatchmaker
	updateIntroduction: UpdateIntroduction
	recordMatchDecision: RecordMatchDecision
	listMatchDecisions: ListMatchDecisions
	submitFeedback: SubmitFeedback
	listFeedback: ListFeedback
	getFeedback: GetFeedback
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
	let feedbackRepo = new SupabaseFeedbackRepository(supabase)

	let usecases: UseCases = {
		createPerson: new CreatePerson({ personRepo, clock, ids }),
		updatePerson: new UpdatePerson({ personRepo }),
		deletePerson: new DeletePerson({ personRepo }),
		getPersonById: new GetPersonById({ personRepo }),
		listPeopleForMatchmaker: new ListPeopleForMatchmaker({ personRepo }),
		findMatchesForPerson: new FindMatchesForPerson({
			personRepo,
			matchDecisionRepo,
			matchFinder,
		}),
		createIntroduction: new CreateIntroduction({
			personRepo,
			introductionRepo,
			clock,
			ids,
		}),
		getIntroductionById: new GetIntroductionById({ introductionRepo }),
		listIntroductionsForMatchmaker: new ListIntroductionsForMatchmaker({
			introductionRepo,
		}),
		updateIntroduction: new UpdateIntroduction({ introductionRepo }),
		recordMatchDecision: new RecordMatchDecision({
			personRepo,
			matchDecisionRepo,
			clock,
			ids,
		}),
		listMatchDecisions: new ListMatchDecisions({ personRepo, matchDecisionRepo }),
		submitFeedback: new SubmitFeedback({ feedbackRepo, clock, ids }),
		listFeedback: new ListFeedback({ feedbackRepo }),
		getFeedback: new GetFeedback({ feedbackRepo }),
	}

	return Object.freeze(usecases)
}
