/**
 * Round-trip test: every enum value advertised in the MCP `update_person`
 * tool's JSON Schema must be accepted by the backend's Zod schema, and
 * values outside the advertised set must be rejected. This is the invariant
 * #80 exists to uphold — keeps the LLM-facing schema honest about what the
 * backend will actually accept.
 */
import { describe, test, expect } from 'bun:test'
import { tools } from '../../../mcp-server/src/toolDefinitions'
import { aboutMeSchema, lookingForSchema, parsePreferences } from '../../src/schemas/preferences'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getRecord(parent: Record<string, unknown>, key: string): Record<string, unknown> {
	let value = parent[key]
	if (!isRecord(value)) throw new Error(`expected object at ${key}, got ${typeof value}`)
	return value
}

function getStringEnum(schema: Record<string, unknown>): string[] {
	let value = schema.enum
	if (!Array.isArray(value) || !value.every((v): v is string => typeof v === 'string')) {
		throw new Error('expected string[] for enum')
	}
	return value
}

function findTool(name: string): Record<string, unknown> {
	let tool = tools.find(t => t.name === name)
	if (!tool) throw new Error(`tool not found: ${name}`)
	if (!isRecord(tool)) throw new Error(`tool ${name} is not an object`)
	return tool
}

let updatePersonSchema = getRecord(findTool('update_person'), 'inputSchema')
let updatePersonProps = getRecord(updatePersonSchema, 'properties')
let preferencesSchema = getRecord(updatePersonProps, 'preferences')
let preferencesProps = getRecord(preferencesSchema, 'properties')

let aboutMeProps = getRecord(getRecord(preferencesProps, 'aboutMe'), 'properties')
let lookingForProps = getRecord(getRecord(preferencesProps, 'lookingFor'), 'properties')
let dealBreakersItems = getRecord(getRecord(preferencesProps, 'dealBreakers'), 'items')

describe('update_person preferences JSON Schema round-trips through Zod', () => {
	test('every advertised aboutMe.build value is accepted by aboutMeSchema', () => {
		for (let build of getStringEnum(getRecord(aboutMeProps, 'build'))) {
			let result = aboutMeSchema.safeParse({ build })
			expect(result.success).toBe(true)
		}
	})

	test('every advertised aboutMe.fitnessLevel value is accepted', () => {
		for (let fitnessLevel of getStringEnum(getRecord(aboutMeProps, 'fitnessLevel'))) {
			let result = aboutMeSchema.safeParse({ fitnessLevel })
			expect(result.success).toBe(true)
		}
	})

	test('every advertised aboutMe.income value is accepted', () => {
		for (let income of getStringEnum(getRecord(aboutMeProps, 'income'))) {
			let result = aboutMeSchema.safeParse({ income })
			expect(result.success).toBe(true)
		}
	})

	test('every advertised lookingFor.fitnessPreference value is accepted', () => {
		for (let fitnessPreference of getStringEnum(getRecord(lookingForProps, 'fitnessPreference'))) {
			let result = lookingForSchema.safeParse({ fitnessPreference })
			expect(result.success).toBe(true)
		}
	})

	test('every advertised lookingFor.incomePreference value is accepted', () => {
		for (let incomePreference of getStringEnum(getRecord(lookingForProps, 'incomePreference'))) {
			let result = lookingForSchema.safeParse({ incomePreference })
			expect(result.success).toBe(true)
		}
	})

	test('every advertised dealBreaker value is accepted by parsePreferences', () => {
		let dealBreakers = getStringEnum(dealBreakersItems)
		let parsed = parsePreferences({ dealBreakers })
		expect(parsed.dealBreakers).toEqual(dealBreakers)
	})

	test('a maximally populated example using only advertised values round-trips intact', () => {
		let example = {
			aboutMe: {
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
				occupation: 'Engineer',
				income: 'high',
			},
			lookingFor: {
				ageRange: { min: 25, max: 35 },
				heightRange: { min: 160, max: 185 },
				fitnessPreference: 'active',
				ethnicityPreference: ['East Asian'],
				incomePreference: 'moderate',
				religionRequired: 'Buddhist',
				wantsChildren: true,
			},
			dealBreakers: ['isSmoker', 'isDivorced'],
		}

		let parsed = parsePreferences(example)

		expect(parsed.aboutMe).toEqual(example.aboutMe)
		expect(parsed.lookingFor).toEqual(example.lookingFor)
		expect(parsed.dealBreakers).toEqual(example.dealBreakers)
	})

	test('values outside the advertised aboutMe.build enum are rejected', () => {
		let result = aboutMeSchema.safeParse({ build: 'muscular' })
		expect(result.success).toBe(false)
	})

	test('values outside the advertised aboutMe.fitnessLevel enum are rejected', () => {
		let result = aboutMeSchema.safeParse({ fitnessLevel: 'extreme' })
		expect(result.success).toBe(false)
	})

	test('values outside the advertised aboutMe.income enum are rejected', () => {
		let result = aboutMeSchema.safeParse({ income: 'ultra' })
		expect(result.success).toBe(false)
	})

	test('values outside the advertised lookingFor.fitnessPreference enum are rejected', () => {
		let result = lookingForSchema.safeParse({ fitnessPreference: 'extreme' })
		expect(result.success).toBe(false)
	})

	test('values outside the advertised lookingFor.incomePreference enum are rejected', () => {
		let result = lookingForSchema.safeParse({ incomePreference: 'ultra' })
		expect(result.success).toBe(false)
	})

	test('values outside the advertised dealBreakers enum are dropped by parsePreferences', () => {
		let parsed = parsePreferences({ dealBreakers: ['isNocturnal'] })
		expect(parsed.dealBreakers).toBeUndefined()
	})
})
