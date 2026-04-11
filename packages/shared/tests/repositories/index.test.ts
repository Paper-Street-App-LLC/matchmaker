import { describe, test, expect } from 'bun:test'
import {
	RepositoryError,
	PersonNotFoundError,
	IntroductionNotFoundError,
	MatchDecisionNotFoundError,
	RepositoryConflictError,
} from '../../src/repositories'
import * as packageRoot from '../../src'
import type {
	IPersonRepository,
	IIntroductionRepository,
	IMatchDecisionRepository,
	IAuthContext,
	PersonUpdate,
	IntroductionUpdate,
} from '../../src/repositories'

describe('repositories barrel', () => {
	test('exports runtime error classes', () => {
		expect(typeof RepositoryError).toBe('function')
		expect(typeof PersonNotFoundError).toBe('function')
		expect(typeof IntroductionNotFoundError).toBe('function')
		expect(typeof MatchDecisionNotFoundError).toBe('function')
		expect(typeof RepositoryConflictError).toBe('function')
	})

	test('all repository interface types are importable', () => {
		// Type-only imports — referenced via stub assignments to keep them used.
		let person: IPersonRepository | null = null
		let intro: IIntroductionRepository | null = null
		let decision: IMatchDecisionRepository | null = null
		let auth: IAuthContext | null = null
		let personPatch: PersonUpdate = {}
		let introPatch: IntroductionUpdate = {}
		expect(person).toBeNull()
		expect(intro).toBeNull()
		expect(decision).toBeNull()
		expect(auth).toBeNull()
		expect(personPatch).toBeDefined()
		expect(introPatch).toBeDefined()
	})

	test('package root re-exports the repository error classes', () => {
		expect(packageRoot.RepositoryError).toBe(RepositoryError)
		expect(packageRoot.PersonNotFoundError).toBe(PersonNotFoundError)
	})
})
