import type {
	Feedback,
	Introduction,
	MatchDecision,
	Person,
} from '@matchmaker/shared'
import type { UseCases } from '../../src/container'
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
	type Clock,
	type IdGenerator,
	type MatchFinderFn,
} from '../../src/usecases'
import { matchFinder } from '../../src/services/matchFinder'
import {
	InMemoryFeedbackRepository,
	InMemoryIntroductionRepository,
	InMemoryMatchDecisionRepository,
	InMemoryPersonRepository,
} from './in-memory-repositories'
import { fixedClock, fixedIds } from '../usecases/fixtures'

export type TestUseCaseSeeds = {
	people?: readonly Person[]
	introductions?: readonly Introduction[]
	decisions?: readonly MatchDecision[]
	feedback?: readonly Feedback[]
	ids?: readonly string[]
	clock?: Clock
	matchFinder?: MatchFinderFn
}

export type TestUseCasesBundle = {
	usecases: UseCases
	personRepo: InMemoryPersonRepository
	introductionRepo: InMemoryIntroductionRepository
	matchDecisionRepo: InMemoryMatchDecisionRepository
	feedbackRepo: InMemoryFeedbackRepository
}

let DEFAULT_GENERATED_IDS = Array.from({ length: 32 }, (_, i) => `gen-id-${i + 1}`)

export let buildTestUseCases = (seeds: TestUseCaseSeeds = {}): TestUseCasesBundle => {
	let personRepo = new InMemoryPersonRepository(seeds.people ?? [])
	let introductionRepo = new InMemoryIntroductionRepository(seeds.introductions ?? [])
	let matchDecisionRepo = new InMemoryMatchDecisionRepository(seeds.decisions ?? [])
	let feedbackRepo = new InMemoryFeedbackRepository(seeds.feedback ?? [])
	let clock = seeds.clock ?? fixedClock()
	let ids: IdGenerator = fixedIds(seeds.ids ?? DEFAULT_GENERATED_IDS)
	let finder = seeds.matchFinder ?? matchFinder

	let usecases: UseCases = {
		createPerson: new CreatePerson({ personRepo, clock, ids }),
		updatePerson: new UpdatePerson({ personRepo }),
		deletePerson: new DeletePerson({ personRepo }),
		getPersonById: new GetPersonById({ personRepo }),
		listPeopleForMatchmaker: new ListPeopleForMatchmaker({ personRepo }),
		findMatchesForPerson: new FindMatchesForPerson({
			personRepo,
			matchDecisionRepo,
			matchFinder: finder,
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

	return { usecases, personRepo, introductionRepo, matchDecisionRepo, feedbackRepo }
}
