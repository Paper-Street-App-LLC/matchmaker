import { z } from 'zod'
import {
	BUILDS,
	FITNESS_LEVELS,
	INCOMES,
	FITNESS_PREFERENCES,
	INCOME_PREFERENCES,
	DEAL_BREAKERS,
} from '@matchmaker/shared'

export let aboutMeSchema = z.object({
	height: z.number().optional(),
	build: z.enum(BUILDS).optional(),
	fitnessLevel: z.enum(FITNESS_LEVELS).optional(),
	ethnicity: z.string().optional(),
	religion: z.string().optional(),
	hasChildren: z.boolean().optional(),
	numberOfChildren: z.number().optional(),
	isDivorced: z.boolean().optional(),
	hasTattoos: z.boolean().optional(),
	hasPiercings: z.boolean().optional(),
	isSmoker: z.boolean().optional(),
	occupation: z.string().optional(),
	income: z.enum(INCOMES).optional(),
})

export let lookingForSchema = z.object({
	ageRange: z
		.object({
			min: z.number().optional(),
			max: z.number().optional(),
		})
		.optional(),
	heightRange: z
		.object({
			min: z.number().optional(),
			max: z.number().optional(),
		})
		.optional(),
	fitnessPreference: z.enum(FITNESS_PREFERENCES).optional(),
	ethnicityPreference: z.array(z.string()).optional(),
	incomePreference: z.enum(INCOME_PREFERENCES).optional(),
	religionRequired: z.string().nullable().optional(),
	wantsChildren: z.boolean().nullable().optional(),
})

let dealBreakersSchema = z.array(z.enum(DEAL_BREAKERS))

export let structuredPreferencesSchema = z.object({
	aboutMe: aboutMeSchema.optional(),
	lookingFor: lookingForSchema.optional(),
	dealBreakers: dealBreakersSchema.optional(),
})

export type StructuredPreferences = z.infer<typeof structuredPreferencesSchema>

export let parsePreferences = (raw: Record<string, unknown> | null): StructuredPreferences => {
	if (!raw) return {}

	let result: StructuredPreferences = {}

	if ('aboutMe' in raw && raw.aboutMe) {
		let parsed = aboutMeSchema.safeParse(raw.aboutMe)
		if (parsed.success) {
			result.aboutMe = parsed.data
		} else {
			console.warn('parsePreferences: invalid aboutMe dropped', parsed.error.issues)
		}
	}

	if ('lookingFor' in raw && raw.lookingFor) {
		let parsed = lookingForSchema.safeParse(raw.lookingFor)
		if (parsed.success) {
			result.lookingFor = parsed.data
		} else {
			console.warn('parsePreferences: invalid lookingFor dropped', parsed.error.issues)
		}
	}

	if ('dealBreakers' in raw && raw.dealBreakers) {
		let parsed = dealBreakersSchema.safeParse(raw.dealBreakers)
		if (parsed.success) {
			result.dealBreakers = parsed.data
		} else {
			console.warn('parsePreferences: invalid dealBreakers dropped', parsed.error.issues)
		}
	}

	return result
}
