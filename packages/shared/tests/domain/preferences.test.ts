import { describe, test, expect } from 'bun:test'
import {
	createPreferences,
	InvalidPreferencesError,
	type PreferencesInput,
} from '../../src/domain/preferences'
import { DomainError } from '../../src/domain/errors'

describe('createPreferences', () => {
	describe('happy path', () => {
		test('returns empty preferences when input is empty object', () => {
			let result = createPreferences({})
			expect(result).toEqual({})
		})

		test('accepts a fully-populated preferences object', () => {
			let input: PreferencesInput = {
				aboutMe: {
					height: 180,
					build: 'athletic',
					fitnessLevel: 'active',
					ethnicity: 'mixed',
					religion: 'none',
					hasChildren: false,
					numberOfChildren: 0,
					isDivorced: false,
					hasTattoos: true,
					hasPiercings: false,
					isSmoker: false,
					occupation: 'engineer',
					income: 'moderate',
				},
				lookingFor: {
					ageRange: { min: 28, max: 38 },
					heightRange: { min: 160, max: 180 },
					fitnessPreference: 'active',
					ethnicityPreference: ['asian', 'latin'],
					incomePreference: 'any',
					religionRequired: null,
					wantsChildren: true,
				},
				dealBreakers: ['isSmoker', 'hasChildren'],
			}

			let result = createPreferences(input)

			expect(result.aboutMe?.build).toBe('athletic')
			expect(result.lookingFor?.ageRange?.min).toBe(28)
			expect(result.dealBreakers).toEqual(['isSmoker', 'hasChildren'])
		})

		test('freezes the returned preferences object', () => {
			let result = createPreferences({})
			expect(Object.isFrozen(result)).toBe(true)
		})

		test('freezes nested aboutMe, lookingFor, and dealBreakers', () => {
			let result = createPreferences({
				aboutMe: { height: 175 },
				lookingFor: { ageRange: { min: 25, max: 35 }, ethnicityPreference: ['asian'] },
				dealBreakers: ['isSmoker'],
			})

			expect(Object.isFrozen(result.aboutMe)).toBe(true)
			expect(Object.isFrozen(result.lookingFor)).toBe(true)
			expect(Object.isFrozen(result.lookingFor?.ageRange)).toBe(true)
			expect(Object.isFrozen(result.lookingFor?.ethnicityPreference)).toBe(true)
			expect(Object.isFrozen(result.dealBreakers)).toBe(true)
		})

		test('drops unknown top-level keys silently', () => {
			// @ts-expect-error — deliberately providing an extra key
			let result = createPreferences({ aboutMe: { height: 170 }, bogus: 'ignored' })
			expect((result as Record<string, unknown>).bogus).toBeUndefined()
			expect(result.aboutMe?.height).toBe(170)
		})
	})

	describe('aboutMe invariants', () => {
		test('throws InvalidPreferencesError when height is zero', () => {
			expect(() => createPreferences({ aboutMe: { height: 0 } })).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when height is negative', () => {
			expect(() => createPreferences({ aboutMe: { height: -1 } })).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when height is NaN', () => {
			expect(() => createPreferences({ aboutMe: { height: Number.NaN } })).toThrow(
				InvalidPreferencesError,
			)
		})

		test('throws InvalidPreferencesError when numberOfChildren is negative', () => {
			expect(() => createPreferences({ aboutMe: { numberOfChildren: -1 } })).toThrow(
				InvalidPreferencesError,
			)
		})

		test('throws InvalidPreferencesError when numberOfChildren is not an integer', () => {
			expect(() => createPreferences({ aboutMe: { numberOfChildren: 1.5 } })).toThrow(
				InvalidPreferencesError,
			)
		})

		test('throws InvalidPreferencesError when build is not a known literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createPreferences({ aboutMe: { build: 'bogus' } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when fitnessLevel is not a known literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createPreferences({ aboutMe: { fitnessLevel: 'intense' } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when income is not a known literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createPreferences({ aboutMe: { income: 'ultra' } }),
			).toThrow(InvalidPreferencesError)
		})
	})

	describe('lookingFor invariants', () => {
		test('throws InvalidPreferencesError when ageRange.min > ageRange.max', () => {
			expect(() =>
				createPreferences({ lookingFor: { ageRange: { min: 40, max: 30 } } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when ageRange.min is negative', () => {
			expect(() =>
				createPreferences({ lookingFor: { ageRange: { min: -1, max: 30 } } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when heightRange.min > heightRange.max', () => {
			expect(() =>
				createPreferences({ lookingFor: { heightRange: { min: 200, max: 150 } } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when ageRange.max is negative', () => {
			expect(() =>
				createPreferences({ lookingFor: { ageRange: { max: -5 } } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when heightRange.max is NaN', () => {
			expect(() =>
				createPreferences({ lookingFor: { heightRange: { max: Number.NaN } } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when fitnessPreference is not a known literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createPreferences({ lookingFor: { fitnessPreference: 'extreme' } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when incomePreference is not a known literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createPreferences({ lookingFor: { incomePreference: 'rich' } }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when ethnicityPreference contains a non-string', () => {
			expect(() =>
				createPreferences({
					// @ts-expect-error — testing runtime rejection of non-string element
					lookingFor: { ethnicityPreference: ['asian', 42] },
				}),
			).toThrow(InvalidPreferencesError)
		})

		test('accepts religionRequired as null', () => {
			let result = createPreferences({ lookingFor: { religionRequired: null } })
			expect(result.lookingFor?.religionRequired).toBeNull()
		})

		test('accepts wantsChildren as null', () => {
			let result = createPreferences({ lookingFor: { wantsChildren: null } })
			expect(result.lookingFor?.wantsChildren).toBeNull()
		})
	})

	describe('dealBreakers invariants', () => {
		test('accepts an empty dealBreakers array', () => {
			let result = createPreferences({ dealBreakers: [] })
			expect(result.dealBreakers).toEqual([])
		})

		test('accepts all five valid deal breaker literals', () => {
			let result = createPreferences({
				dealBreakers: ['isDivorced', 'hasChildren', 'hasTattoos', 'hasPiercings', 'isSmoker'],
			})
			expect(result.dealBreakers).toHaveLength(5)
		})

		test('throws InvalidPreferencesError when dealBreakers contains an unknown literal', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of invalid literal
				createPreferences({ dealBreakers: ['isSmoker', 'bogus'] }),
			).toThrow(InvalidPreferencesError)
		})

		test('throws InvalidPreferencesError when dealBreakers contains duplicates', () => {
			expect(() =>
				createPreferences({ dealBreakers: ['isSmoker', 'isSmoker'] }),
			).toThrow(InvalidPreferencesError)
		})
	})

	describe('error shape', () => {
		test('InvalidPreferencesError extends DomainError', () => {
			let err: unknown = null
			try {
				createPreferences({ aboutMe: { height: -1 } })
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidPreferencesError)
			expect(err).toBeInstanceOf(DomainError)
		})

		test('InvalidPreferencesError has a stable code string', () => {
			let err: unknown = null
			try {
				createPreferences({ aboutMe: { height: -1 } })
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidPreferencesError)
			if (err instanceof InvalidPreferencesError) {
				expect(typeof err.code).toBe('string')
				expect(err.code.length).toBeGreaterThan(0)
			}
		})
	})
})
