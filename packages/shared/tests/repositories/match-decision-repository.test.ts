import { describe, test, expect } from 'bun:test'
import type { IMatchDecisionRepository } from '../../src/repositories/match-decision-repository'
import { createMatchDecision, type MatchDecision } from '../../src/domain/match-decision'

function buildDecision(overrides: Partial<{ candidateId: string }> = {}): MatchDecision {
	return createMatchDecision({
		id: 'decision-1',
		matchmakerId: 'mm-1',
		personId: 'person-1',
		candidateId: overrides.candidateId ?? 'candidate-1',
		decision: 'declined',
		declineReason: 'not a fit',
		createdAt: new Date('2026-01-01T00:00:00Z'),
	})
}

function makeStub(): IMatchDecisionRepository {
	let store: MatchDecision[] = []
	return {
		async findByPerson(personId) {
			return store.filter((d) => d.personId === personId)
		},
		async findByCandidatePair(personId, candidateId) {
			return (
				store.find((d) => d.personId === personId && d.candidateId === candidateId) ?? null
			)
		},
		async create(decision) {
			store.push(decision)
			return decision
		},
	}
}

describe('IMatchDecisionRepository (contract)', () => {
	test('a stub conforming to the interface compiles and runs', async () => {
		let repo = makeStub()
		let decision = buildDecision()

		let created = await repo.create(decision)
		expect(created.id).toBe('decision-1')

		let byPerson = await repo.findByPerson('person-1')
		expect(byPerson.length).toBe(1)

		let byPair = await repo.findByCandidatePair('person-1', 'candidate-1')
		expect(byPair?.id).toBe('decision-1')

		let missingPair = await repo.findByCandidatePair('person-1', 'candidate-other')
		expect(missingPair).toBeNull()
	})

	test('findByPerson returns readonly MatchDecision array', async () => {
		let repo = makeStub()
		await repo.create(buildDecision())
		let list: readonly MatchDecision[] = await repo.findByPerson('person-1')
		expect(list.length).toBe(1)
	})
})
