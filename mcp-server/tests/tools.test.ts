import { describe, test, expect } from 'bun:test'
import { tools } from '../src/index'

function getTool(name: string) {
	let tool = tools.find(t => t.name === name)
	if (!tool) throw new Error(`tool not found: ${name}`)
	return tool
}

describe('tools', () => {
	test('update_person preferences schema exposes nested aboutMe, lookingFor, dealBreakers', () => {
		let schema = getTool('update_person').inputSchema
		let prefs = schema.properties.preferences

		expect(prefs.type).toBe('object')
		expect(prefs.properties).toBeDefined()
		expect(prefs.properties.aboutMe.type).toBe('object')
		expect(prefs.properties.lookingFor.type).toBe('object')
		expect(prefs.properties.dealBreakers.type).toBe('array')
	})

	test('aboutMe schema advertises build, fitnessLevel, income enums matching Zod definitions', () => {
		let aboutMe = getTool('update_person').inputSchema.properties.preferences.properties.aboutMe

		expect(aboutMe.properties.build.enum).toEqual(['slim', 'average', 'athletic', 'heavy'])
		expect(aboutMe.properties.fitnessLevel.enum).toEqual(['active', 'average', 'sedentary'])
		expect(aboutMe.properties.income.enum).toEqual(['high', 'moderate', 'low'])
	})

	test('lookingFor schema advertises ageRange, heightRange structures and preference enums', () => {
		let lookingFor = getTool('update_person').inputSchema.properties.preferences.properties.lookingFor

		expect(lookingFor.properties.ageRange.type).toBe('object')
		expect(lookingFor.properties.ageRange.properties.min.type).toBe('number')
		expect(lookingFor.properties.ageRange.properties.max.type).toBe('number')
		expect(lookingFor.properties.heightRange.type).toBe('object')
		expect(lookingFor.properties.heightRange.properties.min.type).toBe('number')
		expect(lookingFor.properties.heightRange.properties.max.type).toBe('number')
		expect(lookingFor.properties.fitnessPreference.enum).toEqual(['active', 'average', 'any'])
		expect(lookingFor.properties.incomePreference.enum).toEqual(['high', 'moderate', 'any'])
	})

	test('dealBreakers schema enumerates the supported breaker codes', () => {
		let dealBreakers = getTool('update_person').inputSchema.properties.preferences.properties.dealBreakers

		expect(dealBreakers.type).toBe('array')
		expect(dealBreakers.items.enum).toEqual([
			'isDivorced',
			'hasChildren',
			'hasTattoos',
			'hasPiercings',
			'isSmoker',
		])
	})
})
