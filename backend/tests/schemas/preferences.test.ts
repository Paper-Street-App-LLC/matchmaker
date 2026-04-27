import { describe, test, expect } from 'bun:test'
import {
	structuredPreferencesSchema,
	aboutMeSchema,
	lookingForSchema,
	parsePreferences,
} from '../../src/schemas/preferences'

describe('aboutMeSchema', () => {
	test('should accept a fully populated aboutMe object', () => {
		let result = aboutMeSchema.safeParse({
			height: 175,
			build: 'athletic',
			fitnessLevel: 'active',
			ethnicity: 'East Asian',
			religion: 'Buddhist',
			hasChildren: false,
			numberOfChildren: 0,
			isDivorced: false,
			hasTattoos: false,
			hasPiercings: false,
			isSmoker: false,
			occupation: 'Software Engineer',
			income: 'high',
		})
		expect(result.success).toBe(true)
	})

	test('should accept an empty object (all fields optional)', () => {
		let result = aboutMeSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	test('should reject invalid build value', () => {
		let result = aboutMeSchema.safeParse({ build: 'muscular' })
		expect(result.success).toBe(false)
	})

	test('should reject invalid fitnessLevel value', () => {
		let result = aboutMeSchema.safeParse({ fitnessLevel: 'couch_potato' })
		expect(result.success).toBe(false)
	})

	test('should reject invalid income value', () => {
		let result = aboutMeSchema.safeParse({ income: 'rich' })
		expect(result.success).toBe(false)
	})

	test('should accept all valid build values', () => {
		let builds = ['slim', 'average', 'athletic', 'heavy']
		for (let build of builds) {
			let result = aboutMeSchema.safeParse({ build })
			expect(result.success).toBe(true)
		}
	})

	test('should accept all valid income values', () => {
		let incomes = ['high', 'moderate', 'low']
		for (let income of incomes) {
			let result = aboutMeSchema.safeParse({ income })
			expect(result.success).toBe(true)
		}
	})
})

describe('lookingForSchema', () => {
	test('should accept a fully populated lookingFor object', () => {
		let result = lookingForSchema.safeParse({
			ageRange: { min: 25, max: 40 },
			heightRange: { min: 160, max: 185 },
			fitnessPreference: 'active',
			ethnicityPreference: ['East Asian', 'South Asian'],
			incomePreference: 'high',
			religionRequired: 'Christian',
			wantsChildren: true,
		})
		expect(result.success).toBe(true)
	})

	test('should accept an empty object (all fields optional)', () => {
		let result = lookingForSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	test('should accept nullable fields', () => {
		let result = lookingForSchema.safeParse({
			religionRequired: null,
			wantsChildren: null,
		})
		expect(result.success).toBe(true)
	})

	test('should reject invalid fitnessPreference value', () => {
		let result = lookingForSchema.safeParse({
			fitnessPreference: 'gym_rat',
		})
		expect(result.success).toBe(false)
	})

	test('should reject invalid incomePreference value', () => {
		let result = lookingForSchema.safeParse({
			incomePreference: 'wealthy',
		})
		expect(result.success).toBe(false)
	})
})

describe('structuredPreferencesSchema', () => {
	test('should accept a complete structured preferences object', () => {
		let result = structuredPreferencesSchema.safeParse({
			aboutMe: {
				height: 170,
				build: 'average',
				fitnessLevel: 'active',
				religion: 'Christian',
				hasChildren: false,
				occupation: 'Teacher',
				income: 'moderate',
			},
			lookingFor: {
				ageRange: { min: 28, max: 42 },
				religionRequired: 'Christian',
				wantsChildren: true,
			},
			dealBreakers: ['isDivorced', 'isSmoker'],
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.dealBreakers).toEqual(['isDivorced', 'isSmoker'])
		}
	})

	test('should accept empty object', () => {
		let result = structuredPreferencesSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	test('should accept object with only dealBreakers', () => {
		let result = structuredPreferencesSchema.safeParse({
			dealBreakers: ['hasChildren', 'hasTattoos'],
		})
		expect(result.success).toBe(true)
	})

	test('should reject non-array dealBreakers', () => {
		let result = structuredPreferencesSchema.safeParse({
			dealBreakers: 'no smokers',
		})
		expect(result.success).toBe(false)
	})

	test('should reject invalid dealBreaker enum values', () => {
		let result = structuredPreferencesSchema.safeParse({
			dealBreakers: ['not_a_real_dealbreaker'],
		})
		expect(result.success).toBe(false)
	})
})

describe('parsePreferences', () => {
	test('should return parsed preferences for valid input', () => {
		let raw = {
			aboutMe: { height: 175, build: 'athletic' },
			dealBreakers: ['isSmoker'],
		}
		let result = parsePreferences(raw)
		expect(result.aboutMe?.height).toBe(175)
		expect(result.dealBreakers).toEqual(['isSmoker'])
	})

	test('should drop invalid aboutMe section when no valid siblings remain', () => {
		let raw = { aboutMe: { build: 'gigantic' } }
		let result = parsePreferences(raw)
		expect(result.aboutMe).toBeUndefined()
	})

	test('should drop only invalid fields and keep valid siblings in aboutMe', () => {
		let raw = {
			aboutMe: { build: 'gigantic', height: 175, fitnessLevel: 'active' },
		}
		let result = parsePreferences(raw)
		expect(result.aboutMe).toEqual({ height: 175, fitnessLevel: 'active' })
	})

	test('should drop only invalid fields and keep valid siblings in lookingFor', () => {
		let raw = {
			lookingFor: { religionRequired: true, wantsChildren: true, fitnessPreference: 'any' },
		}
		let result = parsePreferences(raw)
		expect(result.lookingFor).toEqual({ wantsChildren: true, fitnessPreference: 'any' })
	})

	test('should drop only invalid entries and keep valid ones in dealBreakers', () => {
		let raw = { dealBreakers: ['isSmoker', 'not_real', 'hasChildren'] }
		let result = parsePreferences(raw)
		expect(result.dealBreakers).toEqual(['isSmoker', 'hasChildren'])
	})

	test('should drop dealBreakers entirely when all entries are invalid', () => {
		let raw = { dealBreakers: ['nope', 'also_nope'] }
		let result = parsePreferences(raw)
		expect(result.dealBreakers).toBeUndefined()
	})

	test('should not log per-field issues by default (silent read-path normalizer)', () => {
		let original = console.warn
		let warnings: unknown[][] = []
		console.warn = (...args: unknown[]) => warnings.push(args)
		try {
			parsePreferences({
				aboutMe: { build: 'gigantic', height: 175 },
				lookingFor: { religionRequired: true },
				dealBreakers: ['nope', 'isSmoker'],
			})
		} finally {
			console.warn = original
		}
		expect(warnings).toEqual([])
	})

	test('should invoke onInvalid callback once per invalid field when provided', () => {
		let issues: Array<{ section: string; path: PropertyKey[]; code: string }> = []
		parsePreferences(
			{
				aboutMe: { build: 'gigantic', height: 175 },
				lookingFor: { religionRequired: true },
				dealBreakers: ['nope', 'isSmoker'],
			},
			{ onInvalid: issue => issues.push(issue) },
		)
		expect(issues.map(i => `${i.section}.${i.path.join('.')}`)).toEqual([
			'aboutMe.build',
			'lookingFor.religionRequired',
			'dealBreakers.0',
		])
	})

	test('should not call per-field safeParse when whole section is valid (fast-path)', () => {
		let aboutMeCallCount = 0
		let originalParse = aboutMeSchema.safeParse.bind(aboutMeSchema)
		let heightSchema = aboutMeSchema.shape.height
		let originalHeightParse = heightSchema.safeParse.bind(heightSchema)
		let heightCallCount = 0
		aboutMeSchema.safeParse = (...args: Parameters<typeof originalParse>) => {
			aboutMeCallCount++
			return originalParse(...args)
		}
		heightSchema.safeParse = (...args: Parameters<typeof originalHeightParse>) => {
			heightCallCount++
			return originalHeightParse(...args)
		}
		try {
			let result = parsePreferences({
				aboutMe: { height: 175, build: 'athletic', fitnessLevel: 'active' },
			})
			expect(result.aboutMe).toEqual({ height: 175, build: 'athletic', fitnessLevel: 'active' })
			expect(aboutMeCallCount).toBe(1)
			expect(heightCallCount).toBe(0)
		} finally {
			aboutMeSchema.safeParse = originalParse
			heightSchema.safeParse = originalHeightParse
		}
	})

	test('should report invalid_type via onInvalid when section is not an object', () => {
		let issues: Array<{ section: string; path: PropertyKey[]; code: string }> = []
		let result = parsePreferences(
			{ aboutMe: 'oops', lookingFor: 123 },
			{ onInvalid: issue => issues.push(issue) },
		)
		expect(result.aboutMe).toBeUndefined()
		expect(result.lookingFor).toBeUndefined()
		expect(issues).toEqual([
			{ section: 'aboutMe', path: [], code: 'invalid_type' },
			{ section: 'lookingFor', path: [], code: 'invalid_type' },
		])
	})

	test('should return empty object for null input', () => {
		let result = parsePreferences(null)
		expect(result).toEqual({})
	})

	test('should return empty preferences for empty object', () => {
		let result = parsePreferences({})
		expect(result).toEqual({})
	})

	test('should keep valid sections and drop fully-invalid ones', () => {
		let raw = {
			aboutMe: { build: 'INVALID' },
			lookingFor: { wantsChildren: true },
			dealBreakers: ['unknown_thing'],
		}
		let result = parsePreferences(raw)
		expect(result.aboutMe).toBeUndefined()
		expect(result.lookingFor).toEqual({ wantsChildren: true })
		expect(result.dealBreakers).toBeUndefined()
	})
})
