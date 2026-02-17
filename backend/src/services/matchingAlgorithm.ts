import type { PersonResponse } from '../schemas/people'
import type { MatchResponse, LimitedPerson } from '../schemas/matches'

let MAX_RESULTS = 3

let toLimitedPerson = (person: PersonResponse): LimitedPerson => ({
	id: person.id,
	name: person.name,
	age: person.age,
	location: person.location,
	gender: person.gender,
})

let calculateLocationScore = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (!subject.location || !candidate.location) return 0
	if (subject.location.toLowerCase() === candidate.location.toLowerCase()) return 0.4
	return 0
}

let calculateAgeScore = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (subject.age == null || candidate.age == null) return 0
	let ageDiff = Math.abs(subject.age - candidate.age)
	if (ageDiff <= 3) return 0.3
	if (ageDiff <= 5) return 0.2
	if (ageDiff <= 10) return 0.1
	return 0
}

let isOppositeGender = (subject: PersonResponse, candidate: PersonResponse): boolean => {
	// If either gender is unknown, don't filter out — include as potential match
	if (!subject.gender || !candidate.gender) return true
	return subject.gender.toLowerCase() !== candidate.gender.toLowerCase()
}

let calculateGenderScore = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (!subject.gender || !candidate.gender) return 0
	// Opposite gender match gets the score (heterosexual matching)
	if (subject.gender.toLowerCase() !== candidate.gender.toLowerCase()) return 0.2
	return 0
}

let buildExplanation = (subject: PersonResponse, candidate: PersonResponse): string => {
	let reasons: string[] = []

	if (
		subject.location &&
		candidate.location &&
		subject.location.toLowerCase() === candidate.location.toLowerCase()
	) {
		reasons.push(`Both based in ${candidate.location}`)
	}

	if (subject.age != null && candidate.age != null) {
		let ageDiff = Math.abs(subject.age - candidate.age)
		if (ageDiff <= 5) {
			reasons.push(`Compatible age range (${subject.age} and ${candidate.age})`)
		}
	}

	if (
		subject.gender &&
		candidate.gender &&
		subject.gender.toLowerCase() !== candidate.gender.toLowerCase()
	) {
		reasons.push(`Complementary match`)
	}

	if (reasons.length === 0) {
		reasons.push('Potential match in the network')
	}

	return reasons.join(', ')
}

export let findMatches = (
	subject: PersonResponse,
	allCandidates: PersonResponse[],
	requestingMatchmakerId: string
): MatchResponse[] => {
	let candidates = allCandidates.filter(p => p.id !== subject.id && p.active && isOppositeGender(subject, p))

	let matches: MatchResponse[] = candidates.map(candidate => {
		let locationScore = calculateLocationScore(subject, candidate)
		let ageScore = calculateAgeScore(subject, candidate)
		let genderScore = calculateGenderScore(subject, candidate)
		let baseScore = 0.1
		let compatibility_score = Math.min(baseScore + locationScore + ageScore + genderScore, 1)

		let isCross = candidate.matchmaker_id !== requestingMatchmakerId

		return {
			person: toLimitedPerson(candidate),
			compatibility_score,
			match_explanation: buildExplanation(subject, candidate),
			is_cross_matchmaker: isCross,
		}
	})

	matches.sort((a, b) => b.compatibility_score - a.compatibility_score)

	return matches.slice(0, MAX_RESULTS)
}
