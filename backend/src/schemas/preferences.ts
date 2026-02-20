import { z } from 'zod'

export let aboutMeSchema = z.object({
	height: z.number().nullable().optional(), // in cm
	build: z
		.enum(['slim', 'athletic', 'average', 'curvy', 'heavyset'])
		.nullable()
		.optional(),
	fitnessLevel: z
		.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'])
		.nullable()
		.optional(),
	ethnicity: z.string().nullable().optional(),
	religion: z.string().nullable().optional(),
	hasChildren: z.boolean().nullable().optional(),
	numberOfChildren: z.number().int().nullable().optional(),
	isDivorced: z.boolean().nullable().optional(),
	hasTattoos: z.boolean().nullable().optional(),
	hasPiercings: z.boolean().nullable().optional(),
	isSmoker: z.boolean().nullable().optional(),
	occupation: z.string().nullable().optional(),
	income: z
		.enum(['<30k', '30k-60k', '60k-100k', '100k-200k', '>200k'])
		.nullable()
		.optional(),
})

export let lookingForSchema = z.object({
	ageRange: z
		.object({
			min: z.number().int(),
			max: z.number().int(),
		})
		.nullable()
		.optional(),
	heightRange: z
		.object({
			min: z.number(), // in cm
			max: z.number(),
		})
		.nullable()
		.optional(),
	fitnessPreference: z
		.array(z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']))
		.nullable()
		.optional(),
	ethnicityPreference: z.array(z.string()).nullable().optional(),
	incomePreference: z
		.array(z.enum(['<30k', '30k-60k', '60k-100k', '100k-200k', '>200k']))
		.nullable()
		.optional(),
	religionRequired: z.boolean().nullable().optional(),
	wantsChildren: z.boolean().nullable().optional(),
})

export let structuredPreferencesSchema = z.object({
	aboutMe: aboutMeSchema.optional(),
	lookingFor: lookingForSchema.optional(),
	dealBreakers: z.array(z.string()).optional(),
})

export type AboutMe = z.infer<typeof aboutMeSchema>
export type LookingFor = z.infer<typeof lookingForSchema>
export type StructuredPreferences = z.infer<typeof structuredPreferencesSchema>

export let parsePreferences = (raw: unknown): StructuredPreferences | null => {
	let result = structuredPreferencesSchema.safeParse(raw)
	return result.success ? result.data : null
}
