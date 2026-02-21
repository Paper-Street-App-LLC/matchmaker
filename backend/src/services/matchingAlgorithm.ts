import type { PersonResponse } from '../schemas/people'
import type { MatchResponse, LimitedPerson } from '../schemas/matches'
import { parsePreferences, type StructuredPreferences } from '../schemas/preferences'

let toLimitedPerson = (person: PersonResponse): LimitedPerson => ({
	id: person.id,
	name: person.name,
	age: person.age,
	location: person.location,
	gender: person.gender,
	is_seed: person.is_seed,
})

// --- Hard Filters ---

let isOppositeGender = (subject: PersonResponse, candidate: PersonResponse): boolean => {
	if (!subject.gender || !candidate.gender) return true
	return subject.gender.toLowerCase() !== candidate.gender.toLowerCase()
}

let checkDealBreakers = (
	dealBreakers: string[] | undefined,
	targetAboutMe: StructuredPreferences['aboutMe']
): boolean => {
	if (!dealBreakers || dealBreakers.length === 0) return true
	if (!targetAboutMe) return true

	for (let breaker of dealBreakers) {
		if (targetAboutMe[breaker as keyof NonNullable<StructuredPreferences['aboutMe']>] === true) return false
	}
	return true
}

let passesDealBreakers = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): boolean => {
	if (!checkDealBreakers(subjectPrefs.dealBreakers, candidatePrefs.aboutMe)) return false
	if (!checkDealBreakers(candidatePrefs.dealBreakers, subjectPrefs.aboutMe)) return false
	return true
}

let checkAgeInRange = (
	age: number | null,
	ageRange: { min?: number; max?: number } | undefined
): boolean => {
	if (!ageRange || age == null) return true
	if (ageRange.min != null && age < ageRange.min) return false
	if (ageRange.max != null && age > ageRange.max) return false
	return true
}

let passesReligionFilter = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): boolean => {
	let subjectRequires = subjectPrefs.lookingFor?.religionRequired
	if (subjectRequires) {
		let candidateReligion = candidatePrefs.aboutMe?.religion
		if (candidateReligion && candidateReligion.toLowerCase() !== subjectRequires.toLowerCase()) {
			return false
		}
	}

	let candidateRequires = candidatePrefs.lookingFor?.religionRequired
	if (candidateRequires) {
		let subjectReligion = subjectPrefs.aboutMe?.religion
		if (subjectReligion && subjectReligion.toLowerCase() !== candidateRequires.toLowerCase()) {
			return false
		}
	}

	return true
}

// --- Scoring Functions ---

let hasStructuredPreferences = (prefs: StructuredPreferences): boolean => {
	return !!(prefs.aboutMe || prefs.lookingFor || prefs.dealBreakers)
}

// Legacy scoring (for people without structured preferences)
let calculateLocationScoreLegacy = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (!subject.location || !candidate.location) return 0
	if (subject.location.toLowerCase() === candidate.location.toLowerCase()) return 0.4
	return 0
}

let calculateAgeScoreLegacy = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (subject.age == null || candidate.age == null) return 0
	let ageDiff = Math.abs(subject.age - candidate.age)
	if (ageDiff <= 3) return 0.3
	if (ageDiff <= 5) return 0.2
	if (ageDiff <= 10) return 0.1
	return 0
}

let calculateGenderScoreLegacy = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (!subject.gender || !candidate.gender) return 0
	if (subject.gender.toLowerCase() !== candidate.gender.toLowerCase()) return 0.2
	return 0
}

// New scoring (for people with structured preferences)
let calculateLocationScore = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (!subject.location || !candidate.location) return 0
	if (subject.location.toLowerCase() === candidate.location.toLowerCase()) return 0.25
	return 0
}

let calculateAgeScore = (
	subject: PersonResponse,
	candidate: PersonResponse,
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): number => {
	if (subject.age == null || candidate.age == null) return 0

	let subjectInRange = checkAgeInRange(candidate.age, subjectPrefs.lookingFor?.ageRange)
	let candidateInRange = checkAgeInRange(subject.age, candidatePrefs.lookingFor?.ageRange)

	if (subjectInRange && candidateInRange) return 0.15

	let ageDiff = Math.abs(subject.age - candidate.age)
	if (ageDiff <= 3) return 0.15
	if (ageDiff <= 5) return 0.10
	if (ageDiff <= 10) return 0.05
	return 0
}

let calculateGenderScore = (subject: PersonResponse, candidate: PersonResponse): number => {
	if (!subject.gender || !candidate.gender) return 0
	if (subject.gender.toLowerCase() !== candidate.gender.toLowerCase()) return 0.10
	return 0
}

let checkHeightInRange = (
	height: number | undefined,
	heightRange: { min?: number; max?: number } | undefined
): boolean => {
	if (!heightRange || height == null) return true
	if (heightRange.min != null && height < heightRange.min) return false
	if (heightRange.max != null && height > heightRange.max) return false
	return true
}

let calculateHeightScore = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): number => {
	let subjectHeight = subjectPrefs.aboutMe?.height
	let candidateHeight = candidatePrefs.aboutMe?.height

	let subjectRange = subjectPrefs.lookingFor?.heightRange
	let candidateRange = candidatePrefs.lookingFor?.heightRange

	if (!subjectRange && !candidateRange) return 0
	if (!subjectHeight && !candidateHeight) return 0

	let subjectSatisfied = checkHeightInRange(candidateHeight, subjectRange)
	let candidateSatisfied = checkHeightInRange(subjectHeight, candidateRange)

	if (subjectSatisfied && candidateSatisfied) return 0.10
	if (subjectSatisfied || candidateSatisfied) return 0.05
	return 0
}

let FITNESS_LEVELS = ['sedentary', 'average', 'active'] as const

let calculateFitnessScore = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): number => {
	let subjectPref = subjectPrefs.lookingFor?.fitnessPreference
	let candidatePref = candidatePrefs.lookingFor?.fitnessPreference
	let subjectLevel = subjectPrefs.aboutMe?.fitnessLevel
	let candidateLevel = candidatePrefs.aboutMe?.fitnessLevel

	if (!subjectPref && !candidatePref) return 0

	let scoreOne = (pref: string | undefined, level: string | undefined): number => {
		if (!pref || !level) return 0
		if (pref === 'any') return 1
		if (pref === level) return 1
		let prefIdx = FITNESS_LEVELS.indexOf(pref as (typeof FITNESS_LEVELS)[number])
		let levelIdx = FITNESS_LEVELS.indexOf(level as (typeof FITNESS_LEVELS)[number])
		if (prefIdx >= 0 && levelIdx >= 0 && Math.abs(prefIdx - levelIdx) === 1) return 0.5
		return 0
	}

	let s1 = scoreOne(subjectPref, candidateLevel)
	let s2 = scoreOne(candidatePref, subjectLevel)

	let count = (subjectPref ? 1 : 0) + (candidatePref ? 1 : 0)
	if (count === 0) return 0
	return ((s1 + s2) / count) * 0.10
}

let calculateEthnicityScore = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): number => {
	let subjectPref = subjectPrefs.lookingFor?.ethnicityPreference
	let candidatePref = candidatePrefs.lookingFor?.ethnicityPreference
	let subjectEthnicity = subjectPrefs.aboutMe?.ethnicity
	let candidateEthnicity = candidatePrefs.aboutMe?.ethnicity

	if (!subjectPref?.length && !candidatePref?.length) return 0

	let scoreOne = (pref: string[] | undefined, ethnicity: string | undefined): number => {
		if (!pref || pref.length === 0) return 1
		if (!ethnicity) return 0
		return pref.some(p => p.toLowerCase() === ethnicity.toLowerCase()) ? 1 : 0
	}

	let s1 = scoreOne(subjectPref, candidateEthnicity)
	let s2 = scoreOne(candidatePref, subjectEthnicity)

	let count = (subjectPref?.length ? 1 : 0) + (candidatePref?.length ? 1 : 0)
	if (count === 0) return 0
	return ((s1 + s2) / count) * 0.10
}

let calculateChildrenScore = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): number => {
	let subjectWants = subjectPrefs.lookingFor?.wantsChildren
	let candidateWants = candidatePrefs.lookingFor?.wantsChildren
	let subjectHas = subjectPrefs.aboutMe?.hasChildren
	let candidateHas = candidatePrefs.aboutMe?.hasChildren

	if (subjectWants == null && candidateWants == null) return 0

	let scoreOne = (wants: boolean | null | undefined, has: boolean | undefined): number => {
		if (wants == null) return 1
		if (has == null) return 0.5
		return wants === has ? 1 : 0
	}

	let s1 = scoreOne(subjectWants, candidateHas)
	let s2 = scoreOne(candidateWants, subjectHas)

	let count = (subjectWants != null ? 1 : 0) + (candidateWants != null ? 1 : 0)
	if (count === 0) return 0
	return ((s1 + s2) / count) * 0.10
}

let calculateReligionScore = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): number => {
	let subjectReligion = subjectPrefs.aboutMe?.religion
	let candidateReligion = candidatePrefs.aboutMe?.religion

	if (!subjectReligion || !candidateReligion) return 0
	if (subjectReligion.toLowerCase() === candidateReligion.toLowerCase()) return 0.05
	return 0
}

let INCOME_LEVELS = ['low', 'moderate', 'high'] as const

let calculateIncomeScore = (
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): number => {
	let subjectPref = subjectPrefs.lookingFor?.incomePreference
	let candidatePref = candidatePrefs.lookingFor?.incomePreference
	let subjectIncome = subjectPrefs.aboutMe?.income
	let candidateIncome = candidatePrefs.aboutMe?.income

	if (!subjectPref && !candidatePref) return 0

	let scoreOne = (pref: string | undefined, income: string | undefined): number => {
		if (!pref || !income) return 0
		if (pref === 'any') return 1
		if (pref === income) return 1
		let prefIdx = INCOME_LEVELS.indexOf(pref as (typeof INCOME_LEVELS)[number])
		let incomeIdx = INCOME_LEVELS.indexOf(income as (typeof INCOME_LEVELS)[number])
		if (prefIdx >= 0 && incomeIdx >= 0 && Math.abs(prefIdx - incomeIdx) === 1) return 0.5
		return 0
	}

	let s1 = scoreOne(subjectPref, candidateIncome)
	let s2 = scoreOne(candidatePref, subjectIncome)

	let count = (subjectPref ? 1 : 0) + (candidatePref ? 1 : 0)
	if (count === 0) return 0
	return ((s1 + s2) / count) * 0.10
}

// --- Explanation Builder ---

let buildExplanation = (
	subject: PersonResponse,
	candidate: PersonResponse,
	subjectPrefs: StructuredPreferences,
	candidatePrefs: StructuredPreferences
): string => {
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

	let subjectReligion = subjectPrefs.aboutMe?.religion
	let candidateReligion = candidatePrefs.aboutMe?.religion
	if (
		subjectReligion &&
		candidateReligion &&
		subjectReligion.toLowerCase() === candidateReligion.toLowerCase()
	) {
		reasons.push(`Both ${candidateReligion}`)
	}

	let subjectFitness = subjectPrefs.aboutMe?.fitnessLevel
	let candidateFitness = candidatePrefs.aboutMe?.fitnessLevel
	if (subjectFitness && candidateFitness && subjectFitness === candidateFitness) {
		reasons.push(`Both ${candidateFitness} fitness level`)
	}

	let subjectEthnicity = subjectPrefs.aboutMe?.ethnicity
	let candidateEthnicity = candidatePrefs.aboutMe?.ethnicity
	if (
		subjectEthnicity &&
		candidateEthnicity &&
		subjectEthnicity.toLowerCase() === candidateEthnicity.toLowerCase()
	) {
		reasons.push(`Shared ${candidateEthnicity} background`)
	}

	let subjectIncome = subjectPrefs.aboutMe?.income
	let candidateIncome = candidatePrefs.aboutMe?.income
	if (subjectIncome && candidateIncome && subjectIncome === candidateIncome) {
		reasons.push(`Similar income level`)
	}

	if (reasons.length === 0) {
		reasons.push('Potential match in the network')
	}

	return reasons.join(', ')
}

// --- Decline Reason Penalty ---

let DECLINE_KEYWORD_MAP: Record<string, keyof NonNullable<StructuredPreferences['aboutMe']>> = {
	tattoo: 'hasTattoos',
	piercing: 'hasPiercings',
	pierc: 'hasPiercings',
	smok: 'isSmoker',
	divorc: 'isDivorced',
	children: 'hasChildren',
	kids: 'hasChildren',
	child: 'hasChildren',
}

let DECLINE_PENALTY_PER_MATCH = 0.15
let DECLINE_PENALTY_CAP = 0.45

export type DeclineReason = { candidateId: string; reason: string }

export type FindMatchesOptions = {
	matchmakerId?: string
	limit?: number
	excludeIds?: Set<string>
	declineReasons?: DeclineReason[]
}

let calculateDeclineReasonPenalty = (
	candidatePrefs: StructuredPreferences,
	declineReasons: DeclineReason[]
): number => {
	if (!declineReasons.length) return 0
	if (!candidatePrefs.aboutMe) return 0

	let matchedFields = new Set<string>()

	for (let { reason } of declineReasons) {
		let lowerReason = reason.toLowerCase()
		for (let [keyword, field] of Object.entries(DECLINE_KEYWORD_MAP)) {
			if (lowerReason.includes(keyword) && candidatePrefs.aboutMe[field] === true) {
				matchedFields.add(field)
			}
		}
	}

	let penalty = matchedFields.size * DECLINE_PENALTY_PER_MATCH
	return Math.min(penalty, DECLINE_PENALTY_CAP)
}

// --- Main Entry Point ---

export let findMatches = (
	personId: string,
	allPeople: PersonResponse[],
	options?: FindMatchesOptions
): MatchResponse[] => {
	let subject = allPeople.find(p => p.id === personId)
	if (!subject) return []

	let subjectPrefs = parsePreferences(subject.preferences)
	let requestingMatchmakerId = options?.matchmakerId
	let excludeIds = options?.excludeIds
	let declineReasons = options?.declineReasons ?? []
	let limit = options?.limit

	let prefsCache = new Map<string, StructuredPreferences>()

	let candidates = allPeople.filter(p => {
		if (p.id === subject.id || !p.active) return false
		if (excludeIds?.has(p.id)) return false
		if (!isOppositeGender(subject, p)) return false

		let candidatePrefs = parsePreferences(p.preferences)
		prefsCache.set(p.id, candidatePrefs)

		if (!passesDealBreakers(subjectPrefs, candidatePrefs)) return false
		if (!passesReligionFilter(subjectPrefs, candidatePrefs)) return false

		return true
	})

	let subjectHasStructured = hasStructuredPreferences(subjectPrefs)

	let matches: MatchResponse[] = candidates.map(candidate => {
		let candidatePrefs = prefsCache.get(candidate.id)!
		let useStructured = subjectHasStructured || hasStructuredPreferences(candidatePrefs)

		let compatibility_score: number

		if (useStructured) {
			let locationScore = calculateLocationScore(subject, candidate)
			let ageScore = calculateAgeScore(subject, candidate, subjectPrefs, candidatePrefs)
			let genderScore = calculateGenderScore(subject, candidate)
			let heightScore = calculateHeightScore(subjectPrefs, candidatePrefs)
			let fitnessScore = calculateFitnessScore(subjectPrefs, candidatePrefs)
			let ethnicityScore = calculateEthnicityScore(subjectPrefs, candidatePrefs)
			let childrenScore = calculateChildrenScore(subjectPrefs, candidatePrefs)
			let religionScore = calculateReligionScore(subjectPrefs, candidatePrefs)
			let incomeScore = calculateIncomeScore(subjectPrefs, candidatePrefs)
			let baseScore = 0.05

			compatibility_score = Math.min(
				baseScore +
					locationScore +
					ageScore +
					genderScore +
					heightScore +
					fitnessScore +
					ethnicityScore +
					childrenScore +
					religionScore +
					incomeScore,
				1
			)
		} else {
			let locationScore = calculateLocationScoreLegacy(subject, candidate)
			let ageScore = calculateAgeScoreLegacy(subject, candidate)
			let genderScore = calculateGenderScoreLegacy(subject, candidate)
			let baseScore = 0.1
			compatibility_score = Math.min(baseScore + locationScore + ageScore + genderScore, 1)
		}

		if (declineReasons.length > 0) {
			let penalty = calculateDeclineReasonPenalty(candidatePrefs, declineReasons)
			compatibility_score = Math.max(compatibility_score - penalty, 0)
		}

		let isCross =
			requestingMatchmakerId != null
				? candidate.matchmaker_id !== requestingMatchmakerId
				: false

		return {
			person: toLimitedPerson(candidate),
			compatibility_score,
			match_explanation: buildExplanation(subject, candidate, subjectPrefs, candidatePrefs),
			is_cross_matchmaker: isCross,
		}
	})

	matches.sort((a, b) => b.compatibility_score - a.compatibility_score)

	if (limit != null) {
		matches = matches.slice(0, limit)
	}

	return matches
}
