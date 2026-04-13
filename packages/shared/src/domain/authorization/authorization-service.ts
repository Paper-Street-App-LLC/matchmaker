/** Framework-free authorization rules — operates on domain entities only. */
import type { Person } from '../person.js'
import type { Introduction } from '../introduction.js'

export function canMatchmakerAccessPerson(matchmakerId: string, person: Person): boolean {
	if (person.matchmakerId === null) return false
	return person.matchmakerId === matchmakerId
}

export function canMatchmakerRecordDecision(matchmakerId: string, person: Person): boolean {
	return canMatchmakerAccessPerson(matchmakerId, person)
}

// Introduction matchmaker ids are non-nullable at the entity level
// (see createIntroduction), so no null guard is needed here.
export function canMatchmakerEditIntroduction(
	matchmakerId: string,
	introduction: Introduction,
): boolean {
	return (
		introduction.matchmakerAId === matchmakerId || introduction.matchmakerBId === matchmakerId
	)
}

export function canMatchmakerCreateIntroduction(
	matchmakerId: string,
	personA: Person,
	personB: Person,
): boolean {
	return (
		canMatchmakerAccessPerson(matchmakerId, personA) ||
		canMatchmakerAccessPerson(matchmakerId, personB)
	)
}

export let AuthorizationService = Object.freeze({
	canMatchmakerAccessPerson,
	canMatchmakerRecordDecision,
	canMatchmakerEditIntroduction,
	canMatchmakerCreateIntroduction,
})
