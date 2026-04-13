import { describe, test, expect } from 'bun:test'
import { toMatchSuggestionResponseDTO } from '../../src/dto/match-suggestion'
import type { MatchSuggestion } from '../../src/usecases/index'

describe('toMatchSuggestionResponseDTO', () => {
	test('maps a MatchSuggestion to a plain response object', () => {
		// Arrange
		let suggestion: MatchSuggestion = {
			person: {
				id: 'p-2',
				name: 'Sam',
				age: 32,
				location: 'Oakland',
				gender: 'nonbinary',
			},
			compatibility_score: 87,
			match_explanation: 'Strong shared interests',
			is_cross_matchmaker: true,
		}

		// Act
		let dto = toMatchSuggestionResponseDTO(suggestion)

		// Assert
		expect(dto).toEqual({
			person: {
				id: 'p-2',
				name: 'Sam',
				age: 32,
				location: 'Oakland',
				gender: 'nonbinary',
			},
			compatibility_score: 87,
			match_explanation: 'Strong shared interests',
			is_cross_matchmaker: true,
		})
	})

	test('preserves null demographic fields on the nested person', () => {
		// Arrange
		let suggestion: MatchSuggestion = {
			person: {
				id: 'p-3',
				name: 'Riley',
				age: null,
				location: null,
				gender: null,
			},
			compatibility_score: 50,
			match_explanation: 'Limited info',
			is_cross_matchmaker: false,
		}

		// Act
		let dto = toMatchSuggestionResponseDTO(suggestion)

		// Assert
		expect(dto.person.age).toBeNull()
		expect(dto.person.location).toBeNull()
		expect(dto.person.gender).toBeNull()
	})
})
