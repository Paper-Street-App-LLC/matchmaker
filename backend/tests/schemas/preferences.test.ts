import { describe, test, expect } from 'bun:test'
import { parsePreferences } from '../../src/schemas/preferences'

describe('parsePreferences', () => {
	test('should return empty object for null input', () => {
		expect(parsePreferences(null)).toEqual({})
	})

	test('should return empty object for non-matching structure', () => {
		expect(parsePreferences({ likes: 'hiking', random: 42 })).toEqual({})
	})

	test('should parse valid full structure', () => {
		let raw = {
			aboutMe: {
				height: 70,
				build: 'athletic',
				fitnessLevel: 'active',
				ethnicity: 'Nigerian',
				religion: 'Christian',
				hasChildren: false,
				numberOfChildren: 0,
				isDivorced: false,
				hasTattoos: false,
				hasPiercings: false,
				isSmoker: false,
				occupation: 'Engineer',
			},
			lookingFor: {
				ageRange: { min: 25, max: 35 },
				heightRange: { min: 64, max: 72 },
				fitnessPreference: 'active',
				ethnicityPreference: ['Nigerian', 'African American'],
				incomePreference: 'moderate',
				religionRequired: 'Christian',
				wantsChildren: true,
			},
			dealBreakers: ['divorced', 'tattoos'],
		}

		let result = parsePreferences(raw)

		expect(result.aboutMe?.height).toBe(70)
		expect(result.aboutMe?.build).toBe('athletic')
		expect(result.aboutMe?.fitnessLevel).toBe('active')
		expect(result.aboutMe?.ethnicity).toBe('Nigerian')
		expect(result.aboutMe?.religion).toBe('Christian')
		expect(result.aboutMe?.hasChildren).toBe(false)
		expect(result.aboutMe?.isDivorced).toBe(false)
		expect(result.aboutMe?.hasTattoos).toBe(false)
		expect(result.aboutMe?.isSmoker).toBe(false)
		expect(result.aboutMe?.occupation).toBe('Engineer')
		expect(result.lookingFor?.ageRange).toEqual({ min: 25, max: 35 })
		expect(result.lookingFor?.heightRange).toEqual({ min: 64, max: 72 })
		expect(result.lookingFor?.fitnessPreference).toBe('active')
		expect(result.lookingFor?.ethnicityPreference).toEqual(['Nigerian', 'African American'])
		expect(result.lookingFor?.religionRequired).toBe('Christian')
		expect(result.lookingFor?.wantsChildren).toBe(true)
		expect(result.dealBreakers).toEqual(['divorced', 'tattoos'])
	})

	test('should handle partial data with only aboutMe', () => {
		let raw = {
			aboutMe: {
				height: 65,
				religion: 'Christian',
			},
		}

		let result = parsePreferences(raw)

		expect(result.aboutMe?.height).toBe(65)
		expect(result.aboutMe?.religion).toBe('Christian')
		expect(result.aboutMe?.build).toBeUndefined()
		expect(result.lookingFor).toBeUndefined()
		expect(result.dealBreakers).toBeUndefined()
	})

	test('should handle partial data with only lookingFor', () => {
		let raw = {
			lookingFor: {
				ageRange: { min: 28 },
				fitnessPreference: 'any',
			},
		}

		let result = parsePreferences(raw)

		expect(result.lookingFor?.ageRange).toEqual({ min: 28 })
		expect(result.lookingFor?.fitnessPreference).toBe('any')
		expect(result.aboutMe).toBeUndefined()
	})

	test('should handle partial data with only dealBreakers', () => {
		let raw = {
			dealBreakers: ['smoker', 'has_children'],
		}

		let result = parsePreferences(raw)

		expect(result.dealBreakers).toEqual(['smoker', 'has_children'])
		expect(result.aboutMe).toBeUndefined()
		expect(result.lookingFor).toBeUndefined()
	})

	test('should ignore extra unknown fields', () => {
		let raw = {
			aboutMe: { height: 70 },
			somethingElse: 'ignored',
			anotherThing: 123,
		}

		let result = parsePreferences(raw)

		expect(result.aboutMe?.height).toBe(70)
		expect('somethingElse' in result).toBe(false)
		expect('anotherThing' in result).toBe(false)
	})

	test('should return empty object for empty object input', () => {
		expect(parsePreferences({})).toEqual({})
	})

	test('should handle religionRequired as null', () => {
		let raw = {
			lookingFor: {
				religionRequired: null,
			},
		}

		let result = parsePreferences(raw)

		expect(result.lookingFor?.religionRequired).toBeNull()
	})

	test('should handle wantsChildren as null', () => {
		let raw = {
			lookingFor: {
				wantsChildren: null,
			},
		}

		let result = parsePreferences(raw)

		expect(result.lookingFor?.wantsChildren).toBeNull()
	})
})
