import { describe, test, expect } from 'bun:test'
import { AuthorizationService } from '../../../src/domain/authorization/authorization-service'
import { createPerson, type Person } from '../../../src/domain/person'
import { createIntroduction, type Introduction } from '../../../src/domain/introduction'

let fixedDate = new Date('2026-01-01T00:00:00.000Z')

function buildPerson(overrides: Partial<Parameters<typeof createPerson>[0]> = {}): Person {
	return createPerson({
		id: 'person-1',
		matchmakerId: 'mm-owner',
		name: 'Alex',
		createdAt: fixedDate,
		updatedAt: fixedDate,
		...overrides,
	})
}

function buildIntroduction(
	overrides: Partial<Parameters<typeof createIntroduction>[0]> = {},
): Introduction {
	return createIntroduction({
		id: 'intro-1',
		matchmakerAId: 'mm-a',
		matchmakerBId: 'mm-b',
		personAId: 'person-a',
		personBId: 'person-b',
		createdAt: fixedDate,
		updatedAt: fixedDate,
		...overrides,
	})
}

describe('AuthorizationService.canMatchmakerAccessPerson', () => {
	test('allows the owning matchmaker', () => {
		let person = buildPerson({ matchmakerId: 'mm-owner' })
		expect(AuthorizationService.canMatchmakerAccessPerson('mm-owner', person)).toBe(true)
	})

	test('denies a non-owning matchmaker', () => {
		let person = buildPerson({ matchmakerId: 'mm-owner' })
		expect(AuthorizationService.canMatchmakerAccessPerson('mm-other', person)).toBe(false)
	})

	test('denies when the person has no matchmaker', () => {
		let person = buildPerson({ matchmakerId: null })
		expect(AuthorizationService.canMatchmakerAccessPerson('mm-owner', person)).toBe(false)
	})
})

describe('AuthorizationService.canMatchmakerRecordDecision', () => {
	test('allows the owning matchmaker', () => {
		let person = buildPerson({ matchmakerId: 'mm-owner' })
		expect(AuthorizationService.canMatchmakerRecordDecision('mm-owner', person)).toBe(true)
	})

	test('denies a non-owning matchmaker', () => {
		let person = buildPerson({ matchmakerId: 'mm-owner' })
		expect(AuthorizationService.canMatchmakerRecordDecision('mm-other', person)).toBe(false)
	})

	test('denies when the person has no matchmaker', () => {
		let person = buildPerson({ matchmakerId: null })
		expect(AuthorizationService.canMatchmakerRecordDecision('mm-owner', person)).toBe(false)
	})
})

describe('AuthorizationService.canMatchmakerEditIntroduction', () => {
	test('allows matchmaker A', () => {
		let introduction = buildIntroduction({ matchmakerAId: 'mm-a', matchmakerBId: 'mm-b' })
		expect(AuthorizationService.canMatchmakerEditIntroduction('mm-a', introduction)).toBe(true)
	})

	test('allows matchmaker B', () => {
		let introduction = buildIntroduction({ matchmakerAId: 'mm-a', matchmakerBId: 'mm-b' })
		expect(AuthorizationService.canMatchmakerEditIntroduction('mm-b', introduction)).toBe(true)
	})

	test('denies an unrelated matchmaker', () => {
		let introduction = buildIntroduction({ matchmakerAId: 'mm-a', matchmakerBId: 'mm-b' })
		expect(AuthorizationService.canMatchmakerEditIntroduction('mm-other', introduction)).toBe(
			false,
		)
	})
})
