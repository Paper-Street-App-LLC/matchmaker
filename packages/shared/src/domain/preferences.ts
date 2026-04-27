/** Preferences value object — framework-free aboutMe / lookingFor / dealBreakers shape. */
import { DomainError } from './errors.js'

export class InvalidPreferencesError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'InvalidPreferencesError'
	}
}

export type Build = 'slim' | 'average' | 'athletic' | 'heavy'
export type FitnessLevel = 'active' | 'average' | 'sedentary'
export type Income = 'high' | 'moderate' | 'low'
export type FitnessPreference = 'active' | 'average' | 'any'
export type IncomePreference = 'high' | 'moderate' | 'any'
export type DealBreaker =
	| 'isDivorced'
	| 'hasChildren'
	| 'hasTattoos'
	| 'hasPiercings'
	| 'isSmoker'

export interface AboutMe {
	readonly height?: number
	readonly build?: Build
	readonly fitnessLevel?: FitnessLevel
	readonly ethnicity?: string
	readonly religion?: string
	readonly hasChildren?: boolean
	readonly numberOfChildren?: number
	readonly isDivorced?: boolean
	readonly hasTattoos?: boolean
	readonly hasPiercings?: boolean
	readonly isSmoker?: boolean
	readonly occupation?: string
	readonly income?: Income
}

export interface Range {
	readonly min?: number
	readonly max?: number
}

export interface LookingFor {
	readonly ageRange?: Range
	readonly heightRange?: Range
	readonly fitnessPreference?: FitnessPreference
	readonly ethnicityPreference?: readonly string[]
	readonly incomePreference?: IncomePreference
	readonly religionRequired?: string | null
	readonly wantsChildren?: boolean | null
}

export interface Preferences {
	readonly aboutMe?: AboutMe
	readonly lookingFor?: LookingFor
	readonly dealBreakers?: readonly DealBreaker[]
}

export type PreferencesInput = Preferences

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

export let BUILDS: readonly Build[] = Object.freeze([
	'slim',
	'average',
	'athletic',
	'heavy',
])
export let FITNESS_LEVELS: readonly FitnessLevel[] = Object.freeze([
	'active',
	'average',
	'sedentary',
])
export let INCOMES: readonly Income[] = Object.freeze(['high', 'moderate', 'low'])
export let FITNESS_PREFERENCES: readonly FitnessPreference[] = Object.freeze([
	'active',
	'average',
	'any',
])
export let INCOME_PREFERENCES: readonly IncomePreference[] = Object.freeze([
	'high',
	'moderate',
	'any',
])
export let DEAL_BREAKERS: readonly DealBreaker[] = Object.freeze([
	'isDivorced',
	'hasChildren',
	'hasTattoos',
	'hasPiercings',
	'isSmoker',
])

function invalid(code: string, message: string): never {
	throw new InvalidPreferencesError(code, message)
}

function isFiniteNumber(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value)
}

function validateAboutMe(aboutMe: AboutMe): AboutMe {
	if (aboutMe.height !== undefined) {
		if (!isFiniteNumber(aboutMe.height) || aboutMe.height <= 0) {
			invalid('INVALID_PREFERENCES_HEIGHT', 'aboutMe.height must be a positive finite number')
		}
	}

	if (aboutMe.numberOfChildren !== undefined) {
		if (!Number.isInteger(aboutMe.numberOfChildren) || aboutMe.numberOfChildren < 0) {
			invalid(
				'INVALID_PREFERENCES_NUMBER_OF_CHILDREN',
				'aboutMe.numberOfChildren must be a non-negative integer',
			)
		}
	}

	if (aboutMe.build !== undefined && !BUILDS.includes(aboutMe.build)) {
		invalid('INVALID_PREFERENCES_BUILD', `aboutMe.build must be one of ${BUILDS.join(', ')}`)
	}

	if (aboutMe.fitnessLevel !== undefined && !FITNESS_LEVELS.includes(aboutMe.fitnessLevel)) {
		invalid(
			'INVALID_PREFERENCES_FITNESS_LEVEL',
			`aboutMe.fitnessLevel must be one of ${FITNESS_LEVELS.join(', ')}`,
		)
	}

	if (aboutMe.income !== undefined && !INCOMES.includes(aboutMe.income)) {
		invalid('INVALID_PREFERENCES_INCOME', `aboutMe.income must be one of ${INCOMES.join(', ')}`)
	}

	// Whitelist-copy known keys so unknown runtime keys are dropped (symmetric with
	// the top-level behavior in createPreferences).
	let out: Mutable<AboutMe> = {}
	if (aboutMe.height !== undefined) out.height = aboutMe.height
	if (aboutMe.build !== undefined) out.build = aboutMe.build
	if (aboutMe.fitnessLevel !== undefined) out.fitnessLevel = aboutMe.fitnessLevel
	if (aboutMe.ethnicity !== undefined) out.ethnicity = aboutMe.ethnicity
	if (aboutMe.religion !== undefined) out.religion = aboutMe.religion
	if (aboutMe.hasChildren !== undefined) out.hasChildren = aboutMe.hasChildren
	if (aboutMe.numberOfChildren !== undefined) out.numberOfChildren = aboutMe.numberOfChildren
	if (aboutMe.isDivorced !== undefined) out.isDivorced = aboutMe.isDivorced
	if (aboutMe.hasTattoos !== undefined) out.hasTattoos = aboutMe.hasTattoos
	if (aboutMe.hasPiercings !== undefined) out.hasPiercings = aboutMe.hasPiercings
	if (aboutMe.isSmoker !== undefined) out.isSmoker = aboutMe.isSmoker
	if (aboutMe.occupation !== undefined) out.occupation = aboutMe.occupation
	if (aboutMe.income !== undefined) out.income = aboutMe.income
	return Object.freeze(out)
}

function validateRange(range: Range, label: string): Range {
	let { min, max } = range

	if (min !== undefined) {
		if (!isFiniteNumber(min) || min < 0) {
			invalid(
				'INVALID_PREFERENCES_RANGE_MIN',
				`${label}.min must be a non-negative finite number`,
			)
		}
	}

	if (max !== undefined) {
		if (!isFiniteNumber(max) || max < 0) {
			invalid(
				'INVALID_PREFERENCES_RANGE_MAX',
				`${label}.max must be a non-negative finite number`,
			)
		}
	}

	if (min !== undefined && max !== undefined && min > max) {
		invalid('INVALID_PREFERENCES_RANGE_ORDER', `${label}.min must be <= ${label}.max`)
	}

	let out: Mutable<Range> = {}
	if (min !== undefined) out.min = min
	if (max !== undefined) out.max = max
	return Object.freeze(out)
}

function validateLookingFor(lookingFor: LookingFor): LookingFor {
	let out: Mutable<LookingFor> = {}

	if (lookingFor.ageRange !== undefined) {
		out.ageRange = validateRange(lookingFor.ageRange, 'lookingFor.ageRange')
	}

	if (lookingFor.heightRange !== undefined) {
		out.heightRange = validateRange(lookingFor.heightRange, 'lookingFor.heightRange')
	}

	if (lookingFor.fitnessPreference !== undefined) {
		if (!FITNESS_PREFERENCES.includes(lookingFor.fitnessPreference)) {
			invalid(
				'INVALID_PREFERENCES_FITNESS_PREFERENCE',
				`lookingFor.fitnessPreference must be one of ${FITNESS_PREFERENCES.join(', ')}`,
			)
		}
		out.fitnessPreference = lookingFor.fitnessPreference
	}

	if (lookingFor.incomePreference !== undefined) {
		if (!INCOME_PREFERENCES.includes(lookingFor.incomePreference)) {
			invalid(
				'INVALID_PREFERENCES_INCOME_PREFERENCE',
				`lookingFor.incomePreference must be one of ${INCOME_PREFERENCES.join(', ')}`,
			)
		}
		out.incomePreference = lookingFor.incomePreference
	}

	if (lookingFor.ethnicityPreference !== undefined) {
		for (let entry of lookingFor.ethnicityPreference) {
			if (typeof entry !== 'string') {
				invalid(
					'INVALID_PREFERENCES_ETHNICITY_PREFERENCE',
					'lookingFor.ethnicityPreference must contain only strings',
				)
			}
		}
		out.ethnicityPreference = Object.freeze([...lookingFor.ethnicityPreference])
	}

	if (lookingFor.religionRequired !== undefined) {
		out.religionRequired = lookingFor.religionRequired
	}

	if (lookingFor.wantsChildren !== undefined) {
		out.wantsChildren = lookingFor.wantsChildren
	}

	return Object.freeze(out)
}

function validateDealBreakers(dealBreakers: readonly DealBreaker[]): readonly DealBreaker[] {
	let seen = new Set<DealBreaker>()
	for (let entry of dealBreakers) {
		if (!DEAL_BREAKERS.includes(entry)) {
			invalid(
				'INVALID_PREFERENCES_DEAL_BREAKER',
				`dealBreakers must contain only known literals; got "${String(entry)}"`,
			)
		}
		if (seen.has(entry)) {
			invalid(
				'INVALID_PREFERENCES_DEAL_BREAKER_DUPLICATE',
				`dealBreakers must not contain duplicates; got "${entry}"`,
			)
		}
		seen.add(entry)
	}
	return Object.freeze([...dealBreakers])
}

export function createPreferences(input: PreferencesInput): Preferences {
	let out: Mutable<Preferences> = {}

	if (input.aboutMe !== undefined) {
		out.aboutMe = validateAboutMe(input.aboutMe)
	}

	if (input.lookingFor !== undefined) {
		out.lookingFor = validateLookingFor(input.lookingFor)
	}

	if (input.dealBreakers !== undefined) {
		out.dealBreakers = validateDealBreakers(input.dealBreakers)
	}

	return Object.freeze(out)
}
