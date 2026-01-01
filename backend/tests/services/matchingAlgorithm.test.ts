import { describe, test, expect } from 'bun:test'
import { findMatches } from '../../src/services/matchingAlgorithm'
import type { PersonResponse } from '../../src/schemas/people'

describe('findMatches', () => {
	test('should return empty array (placeholder)', () => {
		let personId = '550e8400-e29b-41d4-a716-446655440000'
		let allPeople: PersonResponse[] = [
			{
				id: '650e8400-e29b-41d4-a716-446655440001',
				matchmaker_id: '750e8400-e29b-41d4-a716-446655440002',
				name: 'Alice',
				age: 28,
				location: 'NYC',
				gender: 'female',
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			{
				id: '850e8400-e29b-41d4-a716-446655440003',
				matchmaker_id: '750e8400-e29b-41d4-a716-446655440002',
				name: 'Bob',
				age: 30,
				location: 'SF',
				gender: 'male',
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		]

		let matches = findMatches(personId, allPeople)

		expect(Array.isArray(matches)).toBe(true)
		expect(matches).toHaveLength(0)
	})
})
