import { z } from 'zod'

let aboutMeSchema = z.object({
	height: z.number().optional(),
	build: z.enum(['slim', 'average', 'athletic', 'heavy']).optional(),
	fitnessLevel: z.enum(['active', 'average', 'sedentary']).optional(),
	ethnicity: z.string().optional(),
	religion: z.string().optional(),
	hasChildren: z.boolean().optional(),
	numberOfChildren: z.number().optional(),
	isDivorced: z.boolean().optional(),
	hasTattoos: z.boolean().optional(),
	hasPiercings: z.boolean().optional(),
	isSmoker: z.boolean().optional(),
	occupation: z.string().optional(),
})

let lookingForSchema = z.object({
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
	fitnessPreference: z.enum(['active', 'average', 'any']).optional(),
	ethnicityPreference: z.array(z.string()).optional(),
	incomePreference: z.enum(['high', 'moderate', 'any']).optional(),
	religionRequired: z.string().nullable().optional(),
	wantsChildren: z.boolean().nullable().optional(),
})

export let structuredPreferencesSchema = z.object({
	aboutMe: aboutMeSchema.optional(),
	lookingFor: lookingForSchema.optional(),
	dealBreakers: z.array(z.string()).optional(),
})

export type StructuredPreferences = z.infer<typeof structuredPreferencesSchema>

export let parsePreferences = (raw: Record<string, unknown> | null): StructuredPreferences => {
	if (!raw) return {}
	let result = structuredPreferencesSchema.safeParse(raw)
	if (!result.success) return {}
	return result.data
}
