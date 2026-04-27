import type { MatchSuggestion } from '../usecases/index'

export type MatchSuggestionResponseDTO = {
	readonly person: {
		readonly id: string
		readonly name: string
		readonly age: number | null
		readonly location: string | null
		readonly gender: string | null
	}
	readonly compatibility_score: number
	readonly match_explanation: string
	readonly is_cross_matchmaker: boolean
}

export let toMatchSuggestionResponseDTO = (
	suggestion: MatchSuggestion,
): MatchSuggestionResponseDTO => ({
	person: {
		id: suggestion.person.id,
		name: suggestion.person.name,
		age: suggestion.person.age,
		location: suggestion.person.location,
		gender: suggestion.person.gender,
	},
	compatibility_score: suggestion.compatibility_score,
	match_explanation: suggestion.match_explanation,
	is_cross_matchmaker: suggestion.is_cross_matchmaker,
})
