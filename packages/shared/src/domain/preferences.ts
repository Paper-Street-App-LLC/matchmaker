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

export function createPreferences(_input: PreferencesInput): Preferences {
	throw new Error('Not implemented')
}
