import { describe, test, expect } from 'bun:test'
import { findMatches } from '../../src/services/matchingAlgorithm'
import type { PersonResponse } from '../../src/schemas/people'

let matchmakerId = '750e8400-e29b-41d4-a716-446655440002'
let otherMatchmakerId = '999e8400-e29b-41d4-a716-446655440099'

let makePerson = (overrides: Partial<PersonResponse> = {}): PersonResponse => ({
	id: '650e8400-e29b-41d4-a716-446655440001',
	matchmaker_id: matchmakerId,
	name: 'Alice',
	age: 28,
	location: 'NYC',
	gender: 'female',
	preferences: null,
	personality: null,
	notes: 'Private notes about Alice',
	active: true,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides,
})

describe('findMatches', () => {
	let subject = makePerson({
		id: '550e8400-e29b-41d4-a716-446655440000',
		name: 'Sarah',
		age: 27,
		location: 'NYC',
		gender: 'female',
	})

	test('should return candidates excluding the subject person', () => {
		let candidates = [
			subject,
			makePerson({ id: '111e8400-e29b-41d4-a716-446655440011', name: 'Bob', age: 30, gender: 'male' }),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Bob')
	})

	test('should exclude inactive people', () => {
		let candidates = [
			makePerson({ id: '111e8400-e29b-41d4-a716-446655440011', name: 'Bob', active: false }),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(0)
	})

	test('should flag is_cross_matchmaker correctly for same matchmaker', () => {
		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				matchmaker_id: matchmakerId,
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		expect(matches[0].is_cross_matchmaker).toBe(false)
	})

	test('should flag is_cross_matchmaker correctly for different matchmaker', () => {
		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				matchmaker_id: otherMatchmakerId,
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		expect(matches[0].is_cross_matchmaker).toBe(true)
	})

	test('should strip sensitive fields from cross-matchmaker results', () => {
		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				matchmaker_id: otherMatchmakerId,
				notes: 'Secret notes',
				preferences: { likes: 'hiking' },
				personality: { type: 'introvert' },
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		let person = matches[0].person
		expect(person.id).toBeDefined()
		expect(person.name).toBe('Bob')
		expect(person.age).toBeDefined()
		expect(person.location).toBeDefined()
		expect(person.gender).toBeDefined()
		// Should NOT have sensitive fields
		expect('notes' in person).toBe(false)
		expect('preferences' in person).toBe(false)
		expect('personality' in person).toBe(false)
		expect('matchmaker_id' in person).toBe(false)
	})

	test('should include match_explanation string', () => {
		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				age: 30,
				location: 'NYC',
				gender: 'male',
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		expect(typeof matches[0].match_explanation).toBe('string')
		expect(matches[0].match_explanation.length).toBeGreaterThan(0)
	})

	test('should include compatibility_score as a number', () => {
		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		expect(typeof matches[0].compatibility_score).toBe('number')
		expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(0)
		expect(matches[0].compatibility_score).toBeLessThanOrEqual(1)
	})

	test('should score higher for same location', () => {
		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				location: 'NYC',
				age: 30,
				gender: 'male',
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Charlie',
				location: 'LA',
				age: 30,
				gender: 'male',
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(2)
		// NYC match should score higher than LA match
		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	test('should sort results by compatibility_score descending', () => {
		let candidates = [
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Charlie',
				location: 'LA',
				age: 45,
				gender: 'male',
			}),
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				location: 'NYC',
				age: 29,
				gender: 'male',
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(2)
		expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(matches[1].compatibility_score)
	})

	test('should return empty array when no candidates', () => {
		let matches = findMatches(subject, [], matchmakerId)
		expect(matches).toHaveLength(0)
	})

	test('should limit results to 3', () => {
		let candidates = [
			makePerson({ id: '111e8400-e29b-41d4-a716-446655440011', name: 'Bob', gender: 'male', age: 28 }),
			makePerson({ id: '222e8400-e29b-41d4-a716-446655440022', name: 'Charlie', gender: 'male', age: 29 }),
			makePerson({ id: '333e8400-e29b-41d4-a716-446655440033', name: 'Dave', gender: 'male', age: 30 }),
			makePerson({ id: '444e8400-e29b-41d4-a716-446655440044', name: 'Ed', gender: 'male', age: 31 }),
			makePerson({ id: '555e8400-e29b-41d4-a716-446655440055', name: 'Frank', gender: 'male', age: 32 }),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches).toHaveLength(3)
		// Should be sorted by score, so top 3 are returned
		expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(matches[1].compatibility_score)
		expect(matches[1].compatibility_score).toBeGreaterThanOrEqual(matches[2].compatibility_score)
	})

	test('should include location in explanation when locations match', () => {
		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				location: 'NYC',
				gender: 'male',
			}),
		]

		let matches = findMatches(subject, candidates, matchmakerId)

		expect(matches[0].match_explanation).toContain('NYC')
	})

	test('should only match women with men (opposite gender)', () => {
		let femaleSubject = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
		})

		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 29,
				location: 'NYC',
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Lisa',
				gender: 'female',
				age: 26,
				location: 'NYC',
			}),
		]

		let matches = findMatches(femaleSubject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Bob')
	})

	test('should only match men with women (opposite gender)', () => {
		let maleSubject = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Tom',
			age: 30,
			location: 'LA',
			gender: 'male',
		})

		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Sarah',
				gender: 'female',
				age: 28,
				location: 'LA',
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'James',
				gender: 'male',
				age: 31,
				location: 'LA',
			}),
			makePerson({
				id: '333e8400-e29b-41d4-a716-446655440033',
				name: 'Lisa',
				gender: 'female',
				age: 29,
				location: 'NYC',
			}),
		]

		let matches = findMatches(maleSubject, candidates, matchmakerId)

		expect(matches).toHaveLength(2)
		expect(matches.every(m => m.person.gender === 'female')).toBe(true)
	})

	test('should include candidates with no gender when subject has no gender', () => {
		let unknownSubject = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Pat',
			age: 30,
			gender: null,
		})

		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Sam',
				gender: null,
			}),
		]

		let matches = findMatches(unknownSubject, candidates, matchmakerId)

		// When gender is unknown, include all candidates (can't filter)
		expect(matches).toHaveLength(2)
	})

	test('should include candidates with no gender when subject has a gender', () => {
		let femaleSubject = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			gender: 'female',
		})

		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Sam',
				gender: null,
			}),
			makePerson({
				id: '333e8400-e29b-41d4-a716-446655440033',
				name: 'Lisa',
				gender: 'female',
			}),
		]

		let matches = findMatches(femaleSubject, candidates, matchmakerId)

		// Should include opposite gender + unknown gender, exclude same gender
		expect(matches).toHaveLength(2)
		expect(matches.map(m => m.person.name).sort()).toEqual(['Bob', 'Sam'])
	})

	test('should handle gender comparison case-insensitively', () => {
		let femaleSubject = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			gender: 'Female',
		})

		let candidates = [
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Lisa',
				gender: 'female',
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Bob',
				gender: 'Male',
			}),
		]

		let matches = findMatches(femaleSubject, candidates, matchmakerId)

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Bob')
	})
})
