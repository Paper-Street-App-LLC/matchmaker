import { describe, test, expect } from 'bun:test'
import {
	createPerson,
	InvalidPersonError,
	type PersonInput,
} from '../../src/domain/person'
import { DomainError } from '../../src/domain/errors'

function baseInput(overrides: Partial<PersonInput> = {}): PersonInput {
	return {
		id: 'person-1',
		name: 'Alice',
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-01T00:00:00Z'),
		...overrides,
	}
}

describe('createPerson', () => {
	describe('happy path', () => {
		test('returns a frozen Person with all fields populated', () => {
			let result = createPerson({
				id: 'person-1',
				matchmakerId: 'mm-1',
				name: 'Alice',
				age: 30,
				location: 'NYC',
				gender: 'female',
				preferences: { build: 'athletic' },
				personality: { traits: ['curious'] },
				notes: 'met at conference',
				active: true,
				createdAt: new Date('2026-01-01T00:00:00Z'),
				updatedAt: new Date('2026-01-02T00:00:00Z'),
			})

			expect(result.id).toBe('person-1')
			expect(result.matchmakerId).toBe('mm-1')
			expect(result.name).toBe('Alice')
			expect(result.age).toBe(30)
			expect(result.location).toBe('NYC')
			expect(result.gender).toBe('female')
			expect(result.preferences).toEqual({ build: 'athletic' })
			expect(result.personality).toEqual({ traits: ['curious'] })
			expect(result.notes).toBe('met at conference')
			expect(result.active).toBe(true)
			expect(Object.isFrozen(result)).toBe(true)
		})

		test('defaults active to true when omitted', () => {
			let result = createPerson(baseInput())
			expect(result.active).toBe(true)
		})

		test('preserves active=false when provided', () => {
			let result = createPerson(baseInput({ active: false }))
			expect(result.active).toBe(false)
		})

		test('normalizes omitted optional fields to null', () => {
			let result = createPerson(baseInput())
			expect(result.matchmakerId).toBeNull()
			expect(result.age).toBeNull()
			expect(result.location).toBeNull()
			expect(result.gender).toBeNull()
			expect(result.preferences).toBeNull()
			expect(result.personality).toBeNull()
			expect(result.notes).toBeNull()
		})

		test('normalizes matchmakerId undefined to null', () => {
			let result = createPerson(baseInput({ matchmakerId: undefined }))
			expect(result.matchmakerId).toBeNull()
		})

		test('preserves a non-null matchmakerId', () => {
			let result = createPerson(baseInput({ matchmakerId: 'mm-42' }))
			expect(result.matchmakerId).toBe('mm-42')
		})

		test('accepts age of exactly 18', () => {
			let result = createPerson(baseInput({ age: 18 }))
			expect(result.age).toBe(18)
		})

		test('accepts age as null', () => {
			let result = createPerson(baseInput({ age: null }))
			expect(result.age).toBeNull()
		})
	})

	describe('id invariants', () => {
		test('throws InvalidPersonError when id is empty string', () => {
			expect(() => createPerson(baseInput({ id: '' }))).toThrow(InvalidPersonError)
		})

		test('throws InvalidPersonError when id is whitespace only', () => {
			expect(() => createPerson(baseInput({ id: '   ' }))).toThrow(InvalidPersonError)
		})
	})

	describe('name invariants', () => {
		test('throws InvalidPersonError when name is empty string', () => {
			expect(() => createPerson(baseInput({ name: '' }))).toThrow(InvalidPersonError)
		})

		test('throws InvalidPersonError when name is whitespace only', () => {
			expect(() => createPerson(baseInput({ name: '   ' }))).toThrow(InvalidPersonError)
		})
	})

	describe('age invariants', () => {
		test('throws InvalidPersonError when age is 17', () => {
			expect(() => createPerson(baseInput({ age: 17 }))).toThrow(InvalidPersonError)
		})

		test('throws InvalidPersonError when age is negative', () => {
			expect(() => createPerson(baseInput({ age: -5 }))).toThrow(InvalidPersonError)
		})

		test('throws InvalidPersonError when age is not an integer', () => {
			expect(() => createPerson(baseInput({ age: 25.5 }))).toThrow(InvalidPersonError)
		})

		test('throws InvalidPersonError when age is NaN', () => {
			expect(() => createPerson(baseInput({ age: Number.NaN }))).toThrow(InvalidPersonError)
		})
	})

	describe('matchmakerId invariants', () => {
		test('throws InvalidPersonError when matchmakerId is empty string', () => {
			expect(() => createPerson(baseInput({ matchmakerId: '' }))).toThrow(InvalidPersonError)
		})
	})

	describe('timestamp invariants', () => {
		test('throws InvalidPersonError when createdAt is not a Date', () => {
			expect(() =>
				// @ts-expect-error — testing runtime rejection of non-Date value
				createPerson(baseInput({ createdAt: '2026-01-01' })),
			).toThrow(InvalidPersonError)
		})

		test('throws InvalidPersonError when createdAt is an Invalid Date', () => {
			expect(() => createPerson(baseInput({ createdAt: new Date('not-a-date') }))).toThrow(
				InvalidPersonError,
			)
		})

		test('throws InvalidPersonError when updatedAt is before createdAt', () => {
			expect(() =>
				createPerson(
					baseInput({
						createdAt: new Date('2026-01-02T00:00:00Z'),
						updatedAt: new Date('2026-01-01T00:00:00Z'),
					}),
				),
			).toThrow(InvalidPersonError)
		})

		test('accepts updatedAt equal to createdAt', () => {
			let t = new Date('2026-01-01T00:00:00Z')
			let result = createPerson(baseInput({ createdAt: t, updatedAt: t }))
			expect(result.createdAt.getTime()).toBe(result.updatedAt.getTime())
		})
	})

	describe('error shape', () => {
		test('InvalidPersonError extends DomainError', () => {
			let err: unknown = null
			try {
				createPerson(baseInput({ name: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidPersonError)
			expect(err).toBeInstanceOf(DomainError)
		})

		test('InvalidPersonError has a stable code string', () => {
			let err: unknown = null
			try {
				createPerson(baseInput({ name: '' }))
			} catch (e) {
				err = e
			}
			expect(err).toBeInstanceOf(InvalidPersonError)
			if (err instanceof InvalidPersonError) {
				expect(typeof err.code).toBe('string')
				expect(err.code.length).toBeGreaterThan(0)
			}
		})
	})
})
