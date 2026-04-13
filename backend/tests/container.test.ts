import { describe, test, expect } from 'bun:test'
import { createClient } from '@supabase/supabase-js'
import { buildContainer } from '../src/container'
import {
	CreateIntroduction,
	CreatePerson,
	DeletePerson,
	FindMatchesForPerson,
	GetIntroductionById,
	GetPersonById,
	ListMatchDecisions,
	ListPeopleForMatchmaker,
	RecordMatchDecision,
	UpdateIntroductionStatus,
	UpdatePerson,
} from '../src/usecases'

// A real SupabaseClient instance pointed at a non-resolvable URL. The
// adapters only read this via .from(...) at method-call time, so
// buildContainer never touches the network and no `as` cast is needed.
let makeTestClient = () => createClient('https://fake.test.invalid', 'sb-test-key')

describe('buildContainer', () => {
	test('wires all use cases to their concrete classes', () => {
		// Arrange
		let client = makeTestClient()

		// Act
		let usecases = buildContainer(client)

		// Assert
		expect(usecases.createPerson).toBeInstanceOf(CreatePerson)
		expect(usecases.updatePerson).toBeInstanceOf(UpdatePerson)
		expect(usecases.deletePerson).toBeInstanceOf(DeletePerson)
		expect(usecases.getPersonById).toBeInstanceOf(GetPersonById)
		expect(usecases.listPeopleForMatchmaker).toBeInstanceOf(ListPeopleForMatchmaker)
		expect(usecases.findMatchesForPerson).toBeInstanceOf(FindMatchesForPerson)
		expect(usecases.createIntroduction).toBeInstanceOf(CreateIntroduction)
		expect(usecases.getIntroductionById).toBeInstanceOf(GetIntroductionById)
		expect(usecases.updateIntroductionStatus).toBeInstanceOf(UpdateIntroductionStatus)
		expect(usecases.recordMatchDecision).toBeInstanceOf(RecordMatchDecision)
		expect(usecases.listMatchDecisions).toBeInstanceOf(ListMatchDecisions)
	})

	test('returns a frozen struct', () => {
		// Arrange
		let client = makeTestClient()

		// Act
		let usecases = buildContainer(client)

		// Assert
		expect(Object.isFrozen(usecases)).toBe(true)
	})
})
