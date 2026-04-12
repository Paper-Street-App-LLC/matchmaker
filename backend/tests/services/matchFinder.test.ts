import { describe, test, expect } from 'bun:test'
import { createMatchDecision, createPerson } from '@matchmaker/shared'
import { matchFinder } from '../../src/services/matchFinder'
import {
	InMemoryMatchDecisionRepository,
	InMemoryPersonRepository,
} from '../fakes/in-memory-repositories'

let now = new Date('2026-01-01T00:00:00.000Z')

let buildPerson = (overrides: {
	id: string
	matchmakerId?: string | null
	active?: boolean
}) =>
	createPerson({
		id: overrides.id,
		matchmakerId: overrides.matchmakerId ?? 'mm-1',
		name: `Person ${overrides.id}`,
		age: 30,
		location: null,
		gender: null,
		preferences: null,
		personality: null,
		notes: null,
		active: overrides.active ?? true,
		createdAt: now,
		updatedAt: now,
	})

let buildDecision = (overrides: {
	id: string
	matchmakerId: string
	personId: string
	candidateId: string
	decision: 'accepted' | 'declined'
}) =>
	createMatchDecision({
		id: overrides.id,
		matchmakerId: overrides.matchmakerId,
		personId: overrides.personId,
		candidateId: overrides.candidateId,
		decision: overrides.decision,
		declineReason: overrides.decision === 'declined' ? 'not a fit' : null,
		createdAt: now,
	})

describe('matchFinder', () => {
	test('returns algorithm output over the active-people pool', async () => {
		// Arrange
		let subject = buildPerson({ id: 'subject' })
		let candidate = buildPerson({ id: 'cand-1' })
		let personRepo = new InMemoryPersonRepository([subject, candidate])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()

		// Act
		let matches = await matchFinder('subject', 'mm-1', personRepo, matchDecisionRepo)

		// Assert
		expect(matches).toHaveLength(1)
		expect(matches[0]?.person.id).toBe('cand-1')
	})

	test('excludes declined candidates for this matchmaker', async () => {
		// Arrange
		let subject = buildPerson({ id: 'subject' })
		let candA = buildPerson({ id: 'cand-A' })
		let candB = buildPerson({ id: 'cand-B' })
		let personRepo = new InMemoryPersonRepository([subject, candA, candB])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository([
			buildDecision({
				id: 'd-1',
				matchmakerId: 'mm-1',
				personId: 'subject',
				candidateId: 'cand-A',
				decision: 'declined',
			}),
		])

		// Act
		let matches = await matchFinder('subject', 'mm-1', personRepo, matchDecisionRepo)

		// Assert
		let matchedIds = matches.map(m => m.person.id)
		expect(matchedIds).not.toContain('cand-A')
		expect(matchedIds).toContain('cand-B')
	})

	test('still includes accepted candidates in results', async () => {
		// Arrange
		let subject = buildPerson({ id: 'subject' })
		let candA = buildPerson({ id: 'cand-A' })
		let personRepo = new InMemoryPersonRepository([subject, candA])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository([
			buildDecision({
				id: 'd-1',
				matchmakerId: 'mm-1',
				personId: 'subject',
				candidateId: 'cand-A',
				decision: 'accepted',
			}),
		])

		// Act
		let matches = await matchFinder('subject', 'mm-1', personRepo, matchDecisionRepo)

		// Assert
		expect(matches.map(m => m.person.id)).toContain('cand-A')
	})

	test('ignores declines recorded by a different matchmaker', async () => {
		// Arrange
		let subject = buildPerson({ id: 'subject' })
		let candA = buildPerson({ id: 'cand-A' })
		let personRepo = new InMemoryPersonRepository([subject, candA])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository([
			buildDecision({
				id: 'd-1',
				matchmakerId: 'mm-2',
				personId: 'subject',
				candidateId: 'cand-A',
				decision: 'declined',
			}),
		])

		// Act
		let matches = await matchFinder('subject', 'mm-1', personRepo, matchDecisionRepo)

		// Assert
		expect(matches.map(m => m.person.id)).toContain('cand-A')
	})

	test('skips inactive people', async () => {
		// Arrange
		let subject = buildPerson({ id: 'subject' })
		let active = buildPerson({ id: 'cand-active', active: true })
		let inactive = buildPerson({ id: 'cand-inactive', active: false })
		let personRepo = new InMemoryPersonRepository([subject, active, inactive])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()

		// Act
		let matches = await matchFinder('subject', 'mm-1', personRepo, matchDecisionRepo)

		// Assert
		let matchedIds = matches.map(m => m.person.id)
		expect(matchedIds).toContain('cand-active')
		expect(matchedIds).not.toContain('cand-inactive')
	})

	test('returns empty array when no candidates exist', async () => {
		// Arrange
		let subject = buildPerson({ id: 'subject' })
		let personRepo = new InMemoryPersonRepository([subject])
		let matchDecisionRepo = new InMemoryMatchDecisionRepository()

		// Act
		let matches = await matchFinder('subject', 'mm-1', personRepo, matchDecisionRepo)

		// Assert
		expect(matches).toEqual([])
	})
})
