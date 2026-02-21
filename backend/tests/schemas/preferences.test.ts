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

	test('should drop invalid aboutMe section', () => {
		let raw = { aboutMe: { build: 'gigantic' } }
		let result = parsePreferences(raw)
		expect(result.aboutMe).toBeUndefined()
	})

	test('should return empty object for null input', () => {
		let result = parsePreferences(null)
		expect(result).toEqual({})
	})

	test('should return empty preferences for empty object', () => {
		let result = parsePreferences({})
		expect(result).toEqual({})
	})

	test('should keep valid sections and drop invalid ones', () => {
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
