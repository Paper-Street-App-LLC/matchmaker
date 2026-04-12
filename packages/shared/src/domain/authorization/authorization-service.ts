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

export function canMatchmakerEditIntroduction(
	matchmakerId: string,
	introduction: Introduction,
): boolean {
	return (
		introduction.matchmakerAId === matchmakerId || introduction.matchmakerBId === matchmakerId
	)
}

export let AuthorizationService = Object.freeze({
	canMatchmakerAccessPerson,
	canMatchmakerRecordDecision,
	canMatchmakerEditIntroduction,
})
