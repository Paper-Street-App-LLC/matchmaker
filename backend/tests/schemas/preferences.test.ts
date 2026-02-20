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
			income: '100k-200k',
		})
		expect(result.success).toBe(true)
	})

	test('should accept an empty object (all fields optional)', () => {
		let result = aboutMeSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	test('should accept nullable fields', () => {
		let result = aboutMeSchema.safeParse({
			height: null,
			build: null,
			religion: null,
			hasChildren: null,
		})
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
		let builds = ['slim', 'athletic', 'average', 'curvy', 'heavyset']
		for (let build of builds) {
			let result = aboutMeSchema.safeParse({ build })
			expect(result.success).toBe(true)
		}
	})

	test('should accept all valid income values', () => {
		let incomes = ['<30k', '30k-60k', '60k-100k', '100k-200k', '>200k']
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
			fitnessPreference: ['active', 'very_active'],
			ethnicityPreference: ['East Asian', 'South Asian'],
			incomePreference: ['60k-100k', '100k-200k'],
			religionRequired: false,
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
			ageRange: null,
			fitnessPreference: null,
			ethnicityPreference: null,
		})
		expect(result.success).toBe(true)
	})

	test('should reject invalid fitnessPreference values', () => {
		let result = lookingForSchema.safeParse({
			fitnessPreference: ['gym_rat'],
		})
		expect(result.success).toBe(false)
	})

	test('should reject invalid incomePreference values', () => {
		let result = lookingForSchema.safeParse({
			incomePreference: ['wealthy'],
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
				fitnessLevel: 'moderate',
				religion: 'Christian',
				hasChildren: false,
				occupation: 'Teacher',
				income: '30k-60k',
			},
			lookingFor: {
				ageRange: { min: 28, max: 42 },
				religionRequired: true,
				wantsChildren: true,
			},
			dealBreakers: ['smoking', 'no job'],
		})
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.dealBreakers).toEqual(['smoking', 'no job'])
		}
	})

	test('should accept empty object', () => {
		let result = structuredPreferencesSchema.safeParse({})
		expect(result.success).toBe(true)
	})

	test('should accept object with only dealBreakers', () => {
		let result = structuredPreferencesSchema.safeParse({
			dealBreakers: ['drugs', 'gambling'],
		})
		expect(result.success).toBe(true)
	})

	test('should reject non-array dealBreakers', () => {
		let result = structuredPreferencesSchema.safeParse({
			dealBreakers: 'no smokers',
		})
		expect(result.success).toBe(false)
	})
})

describe('parsePreferences', () => {
	test('should return parsed preferences for valid input', () => {
		let raw = {
			aboutMe: { height: 175, build: 'athletic' },
			dealBreakers: ['smokers'],
		}
		let result = parsePreferences(raw)
		expect(result).not.toBeNull()
		expect(result?.aboutMe?.height).toBe(175)
		expect(result?.dealBreakers).toEqual(['smokers'])
	})

	test('should return null for invalid input', () => {
		let raw = { aboutMe: { build: 'gigantic' } }
		let result = parsePreferences(raw)
		expect(result).toBeNull()
	})

	test('should return null for null input', () => {
		let result = parsePreferences(null)
		expect(result).toBeNull()
	})

	test('should return null for non-object input', () => {
		let result = parsePreferences('not an object')
		expect(result).toBeNull()
	})

	test('should return empty preferences for empty object', () => {
		let result = parsePreferences({})
		expect(result).not.toBeNull()
		expect(result).toEqual({})
	})
})
