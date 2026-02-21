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
	is_seed: false,
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
		let allPeople = [
			subject,
			makePerson({ id: '111e8400-e29b-41d4-a716-446655440011', name: 'Bob', age: 30, gender: 'male' }),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Bob')
	})

	test('should exclude inactive people', () => {
		let allPeople = [
			subject,
			makePerson({ id: '111e8400-e29b-41d4-a716-446655440011', name: 'Bob', active: false }),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(0)
	})

	test('should flag is_cross_matchmaker correctly for same matchmaker', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				matchmaker_id: matchmakerId,
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].is_cross_matchmaker).toBe(false)
	})

	test('should flag is_cross_matchmaker correctly for different matchmaker', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				matchmaker_id: otherMatchmakerId,
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].is_cross_matchmaker).toBe(true)
	})

	test('should strip sensitive fields from cross-matchmaker results', () => {
		let allPeople = [
			subject,
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

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

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
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				age: 30,
				location: 'NYC',
				gender: 'male',
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(typeof matches[0].match_explanation).toBe('string')
		expect(matches[0].match_explanation.length).toBeGreaterThan(0)
	})

	test('should include compatibility_score as a number', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(typeof matches[0].compatibility_score).toBe('number')
		expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(0)
		expect(matches[0].compatibility_score).toBeLessThanOrEqual(1)
	})

	test('should score higher for same location', () => {
		let allPeople = [
			subject,
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

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	test('should sort results by compatibility_score descending', () => {
		let allPeople = [
			subject,
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

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
		expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(matches[1].compatibility_score)
	})

	test('should return empty array when no candidates', () => {
		let matches = findMatches(subject.id, [subject], { matchmakerId })
		expect(matches).toHaveLength(0)
	})

	test('should limit results to 3', () => {
		let allPeople = [
			subject,
			makePerson({ id: '111e8400-e29b-41d4-a716-446655440011', name: 'Bob', gender: 'male', age: 28 }),
			makePerson({ id: '222e8400-e29b-41d4-a716-446655440022', name: 'Charlie', gender: 'male', age: 29 }),
			makePerson({ id: '333e8400-e29b-41d4-a716-446655440033', name: 'Dave', gender: 'male', age: 30 }),
			makePerson({ id: '444e8400-e29b-41d4-a716-446655440044', name: 'Ed', gender: 'male', age: 31 }),
			makePerson({ id: '555e8400-e29b-41d4-a716-446655440055', name: 'Frank', gender: 'male', age: 32 }),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId, limit: 3 })

		expect(matches).toHaveLength(3)
		expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(matches[1].compatibility_score)
		expect(matches[1].compatibility_score).toBeGreaterThanOrEqual(matches[2].compatibility_score)
	})

	test('should include location in explanation when locations match', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				location: 'NYC',
				gender: 'male',
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

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

		let allPeople = [
			femaleSubject,
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

		let matches = findMatches(femaleSubject.id, allPeople, { matchmakerId })

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

		let allPeople = [
			maleSubject,
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

		let matches = findMatches(maleSubject.id, allPeople, { matchmakerId })

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

		let allPeople = [
			unknownSubject,
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

		let matches = findMatches(unknownSubject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
	})

	test('should include candidates with no gender when subject has a gender', () => {
		let femaleSubject = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			gender: 'female',
		})

		let allPeople = [
			femaleSubject,
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

		let matches = findMatches(femaleSubject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
		expect(matches.map(m => m.person.name).sort()).toEqual(['Bob', 'Sam'])
	})

	test('should handle gender comparison case-insensitively', () => {
		let femaleSubject = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			gender: 'Female',
		})

		let allPeople = [
			femaleSubject,
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

		let matches = findMatches(femaleSubject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Bob')
	})

	// --- Deal Breaker Filter Tests ---

	test('should filter out candidate when subject has deal breaker "divorced" and candidate is divorced', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { dealBreakers: ['isDivorced'] },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: { isDivorced: true } },
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Charlie',
				gender: 'male',
				age: 29,
				preferences: { aboutMe: { isDivorced: false } },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Charlie')
	})

	test('should filter bidirectionally — candidate deal breaker eliminates subject', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { aboutMe: { hasTattoos: true } },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { dealBreakers: ['hasTattoos'] },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(0)
	})

	test('should filter out candidate with has_children deal breaker', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { dealBreakers: ['hasChildren'] },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: { hasChildren: true } },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(0)
	})

	test('should not filter when deal breakers array is empty', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { dealBreakers: [] },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: { isDivorced: true, hasTattoos: true } },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
	})

	test('should not filter when no preferences exist', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: { isDivorced: true } },
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
	})

	test('should ignore unknown deal breaker strings', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { dealBreakers: ['unknown_thing'] },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
	})

	// --- Age Range Scoring Tests (soft filter — candidates outside range get lower score) ---

	test('should score candidate in preferred age range higher than one outside', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { lookingFor: { ageRange: { min: 25, max: 35 } } },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Old Charlie',
				gender: 'male',
				age: 50,
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Old Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	test('should still include candidate outside age range with lower score', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 45,
			gender: 'female',
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { lookingFor: { ageRange: { min: 25, max: 35 } } },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].compatibility_score).toBeGreaterThan(0)
	})

	test('should score higher when candidate is in partial age range with only min', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { lookingFor: { ageRange: { min: 30 } } },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 22,
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Charlie',
				gender: 'male',
				age: 32,
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		expect(charlieMatch.compatibility_score).toBeGreaterThan(bobMatch.compatibility_score)
	})

	test('should not filter on age range when no age range preference exists', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 55,
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
	})

	// --- Religion Filter Tests ---

	test('should filter out candidate when religion required and does not match', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { lookingFor: { religionRequired: 'Christian' } },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: { religion: 'Muslim' } },
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Charlie',
				gender: 'male',
				age: 29,
				preferences: { aboutMe: { religion: 'Christian' } },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Charlie')
	})

	test('should compare religion case-insensitively', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { lookingFor: { religionRequired: 'christian' } },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: { religion: 'Christian' } },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
	})

	test('should not filter when religionRequired is null', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { lookingFor: { religionRequired: null } },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: { religion: 'Muslim' } },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
	})

	test('should not filter on religion when candidate has no religion in aboutMe', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			gender: 'female',
			preferences: { lookingFor: { religionRequired: 'Christian' } },
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				gender: 'male',
				age: 30,
				preferences: { aboutMe: {} },
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		// Can't confirm religion, so don't filter out
		expect(matches).toHaveLength(1)
	})

	// --- Structured Preferences Scoring Tests ---

	test('should score higher when structured preferences align well', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { height: 64, fitnessLevel: 'active', religion: 'Christian', ethnicity: 'Nigerian' },
				lookingFor: {
					heightRange: { min: 68, max: 76 },
					fitnessPreference: 'active',
					ethnicityPreference: ['Nigerian'],
					wantsChildren: true,
				},
			},
		})

		let goodMatch = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Bob',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: {
					height: 72,
					fitnessLevel: 'active',
					religion: 'Christian',
					ethnicity: 'Nigerian',
					hasChildren: false,
				},
				lookingFor: {
					heightRange: { min: 60, max: 68 },
					fitnessPreference: 'active',
					ethnicityPreference: ['Nigerian'],
					wantsChildren: true,
				},
			},
		})

		let weakMatch = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Charlie',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: null,
		})

		let matches = findMatches(subjectWithPrefs.id, [subjectWithPrefs, goodMatch, weakMatch], {
			matchmakerId,
		})

		expect(matches).toHaveLength(2)
		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	test('should include structured preference reasons in match explanation', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { fitnessLevel: 'active', religion: 'Christian' },
				lookingFor: { fitnessPreference: 'active' },
			},
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				age: 30,
				location: 'NYC',
				gender: 'male',
				preferences: {
					aboutMe: { fitnessLevel: 'active', religion: 'Christian' },
					lookingFor: { fitnessPreference: 'active' },
				},
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].match_explanation).toContain('fitness')
	})

	// --- Backward Compatibility Tests ---

	test('should still work with null preferences (backward compatible)', () => {
		let subjectNull = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: null,
		})

		let allPeople = [
			subjectNull,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				age: 30,
				location: 'NYC',
				gender: 'male',
				preferences: null,
			}),
		]

		let matches = findMatches(subjectNull.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].compatibility_score).toBeGreaterThan(0)
	})

	test('should still work with old-format preferences (backward compatible)', () => {
		let subjectOld = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: { likes: 'hiking', random: 42 },
		})

		let allPeople = [
			subjectOld,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				age: 30,
				location: 'NYC',
				gender: 'male',
				preferences: { interests: ['cooking'] },
			}),
		]

		let matches = findMatches(subjectOld.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].compatibility_score).toBeGreaterThan(0)
	})

	// --- Seed Profile Tests ---

	test('should flag seed profile (matchmaker_id: null) as cross-matchmaker', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Seed Bob',
				gender: 'male',
				age: 30,
				matchmaker_id: null,
				is_seed: true,
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].is_cross_matchmaker).toBe(true)
		expect(matches[0].person.name).toBe('Seed Bob')
		expect(matches[0].person.is_seed).toBe(true)
	})

	test('should include seed profiles in match results alongside regular profiles', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Regular Bob',
				gender: 'male',
				age: 30,
				location: 'NYC',
				matchmaker_id: matchmakerId,
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Seed Charlie',
				gender: 'male',
				age: 29,
				location: 'NYC',
				matchmaker_id: null,
				is_seed: true,
			}),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
		let regular = matches.find(m => m.person.name === 'Regular Bob')!
		let seed = matches.find(m => m.person.name === 'Seed Charlie')!
		expect(regular.is_cross_matchmaker).toBe(false)
		expect(regular.person.is_seed).toBe(false)
		expect(seed.is_cross_matchmaker).toBe(true)
		expect(seed.person.is_seed).toBe(true)
	})

	test('should match seed profiles using structured preferences', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'Houston',
			gender: 'female',
			preferences: {
				aboutMe: { religion: 'Christian', ethnicity: 'Nigerian' },
				lookingFor: { ageRange: { min: 25, max: 35 } },
			},
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Seed Match',
				gender: 'male',
				age: 30,
				location: 'Houston',
				matchmaker_id: null,
				is_seed: true,
				preferences: {
					aboutMe: { religion: 'Christian', ethnicity: 'Nigerian' },
					lookingFor: { ageRange: { min: 24, max: 32 } },
				},
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Seed No Match',
				gender: 'male',
				age: 50,
				location: 'Houston',
				matchmaker_id: null,
				is_seed: true,
				preferences: {
					aboutMe: { religion: 'Muslim' },
					lookingFor: { ageRange: { min: 40, max: 55 } },
				},
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(2)
		let seedMatch = matches.find(m => m.person.name === 'Seed Match')!
		let seedNoMatch = matches.find(m => m.person.name === 'Seed No Match')!
		expect(seedMatch.compatibility_score).toBeGreaterThan(seedNoMatch.compatibility_score)
		expect(seedMatch.is_cross_matchmaker).toBe(true)
	})

	// --- Income Scoring Tests ---

	test('should score higher when income preferences match', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { income: 'high' },
				lookingFor: { incomePreference: 'high' },
			},
		})

		let goodMatch = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Bob',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { income: 'high' },
				lookingFor: { incomePreference: 'high' },
			},
		})

		let weakMatch = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Charlie',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { income: 'low' },
				lookingFor: { incomePreference: 'high' },
			},
		})

		let matches = findMatches(subjectWithPrefs.id, [subjectWithPrefs, goodMatch, weakMatch], {
			matchmakerId,
		})

		expect(matches).toHaveLength(2)
		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	test('should give partial income score for adjacent income levels', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { income: 'moderate' },
				lookingFor: { incomePreference: 'high' },
			},
		})

		let adjacentMatch = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Bob',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { income: 'moderate' },
				lookingFor: { incomePreference: 'moderate' },
			},
		})

		let noIncomeMatch = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Charlie',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: null,
		})

		let matches = findMatches(
			subjectWithPrefs.id,
			[subjectWithPrefs, adjacentMatch, noIncomeMatch],
			{ matchmakerId }
		)

		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	test('should include income in explanation when both have same income level', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { income: 'high' },
			},
		})

		let allPeople = [
			subjectWithPrefs,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Bob',
				age: 30,
				location: 'NYC',
				gender: 'male',
				preferences: {
					aboutMe: { income: 'high' },
				},
			}),
		]

		let matches = findMatches(subjectWithPrefs.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(1)
		expect(matches[0].match_explanation).toContain('income')
	})

	// --- Height Scoring Tests ---

	test('should score higher when height is within preferred range', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { height: 64 },
				lookingFor: { heightRange: { min: 68, max: 76 } },
			},
		})

		let tallBob = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Bob',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { height: 72 },
				lookingFor: { heightRange: { min: 60, max: 68 } },
			},
		})

		let shortCharlie = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Charlie',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { height: 62 },
			},
		})

		let matches = findMatches(subjectWithPrefs.id, [subjectWithPrefs, tallBob, shortCharlie], {
			matchmakerId,
		})

		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	// --- Ethnicity Scoring Tests ---

	test('should score higher when ethnicity matches preference', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { ethnicity: 'Nigerian' },
				lookingFor: { ethnicityPreference: ['Nigerian'] },
			},
		})

		let matchingBob = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Bob',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { ethnicity: 'Nigerian' },
				lookingFor: { ethnicityPreference: ['Nigerian'] },
			},
		})

		let nonMatchingCharlie = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Charlie',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { ethnicity: 'Korean' },
				lookingFor: { ethnicityPreference: ['Korean'] },
			},
		})

		let matches = findMatches(
			subjectWithPrefs.id,
			[subjectWithPrefs, matchingBob, nonMatchingCharlie],
			{ matchmakerId }
		)

		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	// --- Children Scoring Tests ---

	test('should score higher when children preferences align', () => {
		let subjectWithPrefs = makePerson({
			id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Sarah',
			age: 27,
			location: 'NYC',
			gender: 'female',
			preferences: {
				aboutMe: { hasChildren: false },
				lookingFor: { wantsChildren: false },
			},
		})

		let noKidsBob = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Bob',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { hasChildren: false },
				lookingFor: { wantsChildren: false },
			},
		})

		let hasKidsCharlie = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Charlie',
			age: 30,
			location: 'NYC',
			gender: 'male',
			preferences: {
				aboutMe: { hasChildren: true },
				lookingFor: { wantsChildren: true },
			},
		})

		let matches = findMatches(
			subjectWithPrefs.id,
			[subjectWithPrefs, noKidsBob, hasKidsCharlie],
			{ matchmakerId }
		)

		let bobMatch = matches.find(m => m.person.name === 'Bob')!
		let charlieMatch = matches.find(m => m.person.name === 'Charlie')!
		expect(bobMatch.compatibility_score).toBeGreaterThan(charlieMatch.compatibility_score)
	})

	// --- Options: limit, excludeIds, decline penalty ---

	test('should return at most 3 results when limit is 3', () => {
		let allPeople = [
			subject,
			...Array.from({ length: 6 }, (_, i) =>
				makePerson({
					id: `111e8400-e29b-41d4-a716-44665544001${i}`,
					name: `Candidate ${i}`,
					gender: 'male',
					age: 28 + i,
					location: 'NYC',
				})
			),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId, limit: 3 })

		expect(matches).toHaveLength(3)
	})

	test('should return all results when limit is not specified', () => {
		let allPeople = [
			subject,
			...Array.from({ length: 5 }, (_, i) =>
				makePerson({
					id: `111e8400-e29b-41d4-a716-44665544001${i}`,
					name: `Candidate ${i}`,
					gender: 'male',
					age: 28 + i,
					location: 'NYC',
				})
			),
		]

		let matches = findMatches(subject.id, allPeople, { matchmakerId })

		expect(matches).toHaveLength(5)
	})

	test('should exclude candidates in excludeIds', () => {
		let allPeople = [
			subject,
			makePerson({
				id: '111e8400-e29b-41d4-a716-446655440011',
				name: 'Keep',
				gender: 'male',
				age: 30,
			}),
			makePerson({
				id: '222e8400-e29b-41d4-a716-446655440022',
				name: 'Exclude',
				gender: 'male',
				age: 30,
			}),
		]

		let excludeIds = new Set(['222e8400-e29b-41d4-a716-446655440022'])
		let matches = findMatches(subject.id, allPeople, { matchmakerId, excludeIds })

		expect(matches).toHaveLength(1)
		expect(matches[0].person.name).toBe('Keep')
	})

	test('should apply decline reason penalty for tattoos keyword', () => {
		let candidateWithTattoos = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Tattooed Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: {
				aboutMe: { hasTattoos: true },
			},
		})
		let candidateWithout = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Clean Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: {
				aboutMe: { hasTattoos: false },
			},
		})

		let declineReasons = [
			{ candidateId: '000e8400-e29b-41d4-a716-446655440099', reason: 'she does not like tattoos' },
		]
		let matches = findMatches(
			subject.id,
			[subject, candidateWithTattoos, candidateWithout],
			{ matchmakerId, declineReasons }
		)

		let tattooed = matches.find(m => m.person.name === 'Tattooed Bob')!
		let clean = matches.find(m => m.person.name === 'Clean Bob')!

		expect(tattooed.compatibility_score).toBeLessThan(clean.compatibility_score)
	})

	test('should not apply decline reason penalty when keyword does not match candidate', () => {
		let candidate = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'No Tattoos Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: {
				aboutMe: { hasTattoos: false },
			},
		})

		let declineReasons = [
			{ candidateId: '000e8400-e29b-41d4-a716-446655440099', reason: 'she does not like tattoos' },
		]
		let withPenalty = findMatches(subject.id, [subject, candidate], { matchmakerId, declineReasons })
		let withoutPenalty = findMatches(subject.id, [subject, candidate], { matchmakerId })

		expect(withPenalty[0].compatibility_score).toBe(withoutPenalty[0].compatibility_score)
	})

	test('should cap decline penalty so score does not go below 0', () => {
		let candidate = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Everything Bob',
			gender: 'male',
			age: 30,
			preferences: {
				aboutMe: {
					hasTattoos: true,
					hasPiercings: true,
					isSmoker: true,
					isDivorced: true,
					hasChildren: true,
				},
			},
		})

		let declineReasons = [
			{ candidateId: 'a', reason: 'tattoos are a dealbreaker' },
			{ candidateId: 'b', reason: 'piercings not her thing' },
			{ candidateId: 'c', reason: 'she hates smoking' },
			{ candidateId: 'd', reason: 'no divorced men' },
			{ candidateId: 'e', reason: 'no children please' },
		]
		let matches = findMatches(subject.id, [subject, candidate], { matchmakerId, declineReasons })

		expect(matches[0].compatibility_score).toBeGreaterThanOrEqual(0)
	})

	test('should apply penalty for smoker keyword variations', () => {
		let smokerCandidate = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Smoker Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: { aboutMe: { isSmoker: true } },
		})
		let nonSmoker = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Clean Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: { aboutMe: { isSmoker: false } },
		})

		let declineReasons = [
			{ candidateId: 'x', reason: 'smoking is a no-go' },
		]
		let matches = findMatches(
			subject.id,
			[subject, smokerCandidate, nonSmoker],
			{ matchmakerId, declineReasons }
		)

		let smoker = matches.find(m => m.person.name === 'Smoker Bob')!
		let clean = matches.find(m => m.person.name === 'Clean Bob')!
		expect(smoker.compatibility_score).toBeLessThan(clean.compatibility_score)
	})

	test('should not apply penalty when keyword appears as part of a name (e.g. "Pierce")', () => {
		let candidate = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Pierced Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: { aboutMe: { hasPiercings: true } },
		})

		let declineReasons = [
			{ candidateId: 'x', reason: "she didn't like Pierce" },
		]
		let withDecline = findMatches(subject.id, [subject, candidate], { matchmakerId, declineReasons })
		let withoutDecline = findMatches(subject.id, [subject, candidate], { matchmakerId })

		expect(withDecline[0].compatibility_score).toBe(withoutDecline[0].compatibility_score)
	})

	test('should still apply penalty for valid piercing keyword in context', () => {
		let candidate = makePerson({
			id: '111e8400-e29b-41d4-a716-446655440011',
			name: 'Pierced Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: { aboutMe: { hasPiercings: true } },
		})
		let clean = makePerson({
			id: '222e8400-e29b-41d4-a716-446655440022',
			name: 'Clean Bob',
			gender: 'male',
			age: 30,
			location: 'NYC',
			preferences: { aboutMe: { hasPiercings: false } },
		})

		let declineReasons = [
			{ candidateId: 'x', reason: 'she does not like piercings' },
		]
		let matches = findMatches(
			subject.id,
			[subject, candidate, clean],
			{ matchmakerId, declineReasons }
		)

		let pierced = matches.find(m => m.person.name === 'Pierced Bob')!
		let noPiercing = matches.find(m => m.person.name === 'Clean Bob')!
		expect(pierced.compatibility_score).toBeLessThan(noPiercing.compatibility_score)
	})
})
