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

export type PreferenceIssue = {
	section: 'aboutMe' | 'lookingFor' | 'dealBreakers'
	path: PropertyKey[]
	code: string
}

export type ParsePreferencesOptions = {
	onInvalid?: (issue: PreferenceIssue) => void
}

let stripObjectFields = <T extends z.ZodObject>(
	schema: T,
	raw: unknown,
	section: PreferenceIssue['section'],
	onInvalid: (issue: PreferenceIssue) => void,
): z.infer<T> | undefined => {
	if (!raw || typeof raw !== 'object') return undefined
	let cleaned: Record<string, unknown> = {}
	for (let [key, fieldSchema] of Object.entries(schema.shape)) {
		if (!(key in raw)) continue
		let value = (raw as Record<string, unknown>)[key]
		let parsed = (fieldSchema as z.ZodTypeAny).safeParse(value)
		if (parsed.success) {
			if (parsed.data !== undefined) cleaned[key] = parsed.data
		} else {
			for (let issue of parsed.error.issues) {
				onInvalid({ section, path: [key, ...issue.path], code: issue.code })
			}
		}
	}
	return Object.keys(cleaned).length === 0 ? undefined : (cleaned as z.infer<T>)
}

export let parsePreferences = (
	raw: Record<string, unknown> | null,
	options: ParsePreferencesOptions = {},
): StructuredPreferences => {
	if (!raw) return {}

	let onInvalid = options.onInvalid ?? (() => {})

	let result: StructuredPreferences = {}

	if ('aboutMe' in raw && raw.aboutMe) {
		let cleaned = stripObjectFields(aboutMeSchema, raw.aboutMe, 'aboutMe', onInvalid)
		if (cleaned) result.aboutMe = cleaned
	}

	if ('lookingFor' in raw && raw.lookingFor) {
		let cleaned = stripObjectFields(lookingForSchema, raw.lookingFor, 'lookingFor', onInvalid)
		if (cleaned) result.lookingFor = cleaned
	}

	if ('dealBreakers' in raw && raw.dealBreakers) {
		if (Array.isArray(raw.dealBreakers)) {
			let kept: z.infer<typeof dealBreakersSchema> = []
			raw.dealBreakers.forEach((entry, index) => {
				let parsed = dealBreakersSchema.element.safeParse(entry)
				if (parsed.success) {
					kept.push(parsed.data)
				} else {
					for (let issue of parsed.error.issues) {
						onInvalid({ section: 'dealBreakers', path: [index, ...issue.path], code: issue.code })
					}
				}
			})
			if (kept.length > 0) result.dealBreakers = kept
		} else {
			onInvalid({ section: 'dealBreakers', path: [], code: 'invalid_type' })
		}
	}

	return result
}
