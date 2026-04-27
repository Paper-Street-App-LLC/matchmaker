import {
	createPerson,
	createIntroduction as buildIntroduction,
	createMatchDecision,
	type Decision,
	type Introduction,
	type MatchDecision,
	type Person,
} from '@matchmaker/shared'
import type { Clock, IdGenerator, UseCaseResult } from '../../src/usecases/types'

export let FIXED_NOW = new Date('2026-04-12T12:00:00.000Z')

export type MakePersonOverrides = {
	id?: string
	matchmakerId?: string | null
	name?: string
	age?: number | null
	location?: string | null
	gender?: string | null
	active?: boolean
	notes?: string | null
	createdAt?: Date
	updatedAt?: Date
}

export let makePerson = (overrides: MakePersonOverrides = {}): Person =>
	createPerson({
		id: overrides.id ?? 'p-1',
		matchmakerId: 'matchmakerId' in overrides ? overrides.matchmakerId : 'mm-user',
		name: overrides.name ?? 'Alex',
		age: overrides.age ?? 30,
		location: overrides.location ?? null,
		gender: overrides.gender ?? null,
		preferences: null,
		personality: null,
		notes: overrides.notes ?? null,
		active: overrides.active ?? true,
		createdAt: overrides.createdAt ?? FIXED_NOW,
		updatedAt: overrides.updatedAt ?? FIXED_NOW,
	})

export type MakeIntroductionOverrides = {
	id?: string
	matchmakerAId?: string
	matchmakerBId?: string
	personAId?: string
	personBId?: string
	status?: Introduction['status']
	notes?: string | null
	createdAt?: Date
	updatedAt?: Date
}

export let makeIntroduction = (overrides: MakeIntroductionOverrides = {}): Introduction =>
	buildIntroduction({
		id: overrides.id ?? 'intro-1',
		matchmakerAId: overrides.matchmakerAId ?? 'mm-user',
		matchmakerBId: overrides.matchmakerBId ?? 'mm-other',
		personAId: overrides.personAId ?? 'p-a',
		personBId: overrides.personBId ?? 'p-b',
		status: overrides.status ?? 'pending',
		notes: overrides.notes ?? null,
		createdAt: overrides.createdAt ?? FIXED_NOW,
		updatedAt: overrides.updatedAt ?? FIXED_NOW,
	})

export type MakeDecisionOverrides = {
	id?: string
	matchmakerId?: string
	personId?: string
	candidateId?: string
	decision?: Decision
	declineReason?: string | null
	createdAt?: Date
}

export let makeDecision = (overrides: MakeDecisionOverrides = {}): MatchDecision =>
	createMatchDecision({
		id: overrides.id ?? 'decision-1',
		matchmakerId: overrides.matchmakerId ?? 'mm-user',
		personId: overrides.personId ?? 'p-a',
		candidateId: overrides.candidateId ?? 'p-b',
		decision: overrides.decision ?? 'accepted',
		declineReason: overrides.declineReason ?? null,
		createdAt: overrides.createdAt ?? FIXED_NOW,
	})

export let fixedClock = (date: Date = FIXED_NOW): Clock => ({
	now: () => date,
})

export let fixedIds = (ids: readonly string[]): IdGenerator => {
	let queue = [...ids]
	return {
		newId: () => {
			let next = queue.shift()
			if (next === undefined) {
				throw new Error('fixedIds queue exhausted')
			}
			return next
		},
	}
}

type OkResult<T> = Extract<UseCaseResult<T>, { ok: true }>
type ErrResult<T> = Extract<UseCaseResult<T>, { ok: false }>

export function assertOk<T>(result: UseCaseResult<T>): asserts result is OkResult<T> {
	if (!result.ok) {
		throw new Error(`expected ok result, got error: ${result.error.code} — ${result.error.message}`)
	}
}

export function assertErr<T>(result: UseCaseResult<T>): asserts result is ErrResult<T> {
	if (result.ok) {
		throw new Error('expected error result, got ok')
	}
}
