/**
 * Preferences value object for the domain layer.
 *
 * Framework-free representation of a person's self-description (aboutMe),
 * candidate preferences (lookingFor), and deal breakers. Part of Clean
 * Architecture — no Zod, Supabase, or Hono imports here.
 *
 * Nullability convention: `lookingFor.religionRequired` and `lookingFor.wantsChildren`
 * explicitly allow `null` to encode "no requirement." All other fields use optional
 * (`?`) — omitted means "not specified."
 */
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

const BUILDS: readonly Build[] = ['slim', 'average', 'athletic', 'heavy']
const FITNESS_LEVELS: readonly FitnessLevel[] = ['active', 'average', 'sedentary']
const INCOMES: readonly Income[] = ['high', 'moderate', 'low']
const FITNESS_PREFERENCES: readonly FitnessPreference[] = ['active', 'average', 'any']
const INCOME_PREFERENCES: readonly IncomePreference[] = ['high', 'moderate', 'any']
const DEAL_BREAKERS: readonly DealBreaker[] = [
	'isDivorced',
	'hasChildren',
	'hasTattoos',
	'hasPiercings',
	'isSmoker',
]

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
		if (
			!Number.isInteger(aboutMe.numberOfChildren) ||
			(aboutMe.numberOfChildren as number) < 0
		) {
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

	return Object.freeze({ ...aboutMe })
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

	return Object.freeze({ ...range })
}

function validateLookingFor(lookingFor: LookingFor): LookingFor {
	let out: {
		ageRange?: Range
		heightRange?: Range
		fitnessPreference?: FitnessPreference
		ethnicityPreference?: readonly string[]
		incomePreference?: IncomePreference
		religionRequired?: string | null
		wantsChildren?: boolean | null
	} = {}

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
	let out: {
		aboutMe?: AboutMe
		lookingFor?: LookingFor
		dealBreakers?: readonly DealBreaker[]
	} = {}

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
