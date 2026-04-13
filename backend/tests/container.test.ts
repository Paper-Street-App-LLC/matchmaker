import { describe, test, expect } from 'bun:test'
import { buildContainer } from '../src/container'
import {
	CreateIntroductionUseCase,
	CreatePerson,
	DeletePerson,
	FindMatchesForPerson,
	ListMatchDecisions,
	ListPeopleForMatchmaker,
	RecordMatchDecision,
	UpdateIntroductionStatus,
	UpdatePerson,
} from '../src/usecases'
import type { SupabaseClient } from '../src/lib/supabase'

describe('buildContainer', () => {
	test('wires all 9 use cases to their concrete classes', () => {
		// Arrange — the adapters only touch the client when methods run; object
		// identity is enough for the wiring check.
		let stubClient = {} as SupabaseClient

		// Act
		let usecases = buildContainer(stubClient)

		// Assert
		expect(usecases.createPerson).toBeInstanceOf(CreatePerson)
		expect(usecases.updatePerson).toBeInstanceOf(UpdatePerson)
		expect(usecases.deletePerson).toBeInstanceOf(DeletePerson)
		expect(usecases.listPeopleForMatchmaker).toBeInstanceOf(ListPeopleForMatchmaker)
		expect(usecases.findMatchesForPerson).toBeInstanceOf(FindMatchesForPerson)
		expect(usecases.createIntroduction).toBeInstanceOf(CreateIntroductionUseCase)
		expect(usecases.updateIntroductionStatus).toBeInstanceOf(UpdateIntroductionStatus)
		expect(usecases.recordMatchDecision).toBeInstanceOf(RecordMatchDecision)
		expect(usecases.listMatchDecisions).toBeInstanceOf(ListMatchDecisions)
	})

	test('returns a frozen struct', () => {
		// Arrange
		let stubClient = {} as SupabaseClient

		// Act
		let usecases = buildContainer(stubClient)

		// Assert
		expect(Object.isFrozen(usecases)).toBe(true)
	})
})
