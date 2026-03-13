import type { IApiClient } from './api.js'
import type { ToolName } from './tools.js'
import {
	validateAddPersonArgs,
	validateGetPersonArgs,
	validateUpdatePersonArgs,
	validateCreateIntroductionArgs,
	validateUpdateIntroductionArgs,
	validateFindMatchesArgs,
	validateDeletePersonArgs,
	validateGetIntroductionArgs,
	validateSubmitFeedbackArgs,
	validateListFeedbackArgs,
	validateGetFeedbackArgs,
} from './tools.js'

type ToolResult = {
	content: Array<{ type: 'text'; text: string }>
	structuredContent?: Record<string, unknown>
	isError?: boolean
}

type ToolHandler = (args: unknown) => Promise<ToolResult>

function successResult(data: unknown): ToolResult {
	return {
		content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
	}
}

export function createToolHandlers(apiClient: IApiClient): Record<ToolName, ToolHandler> {
	return {
		add_person: async args => {
			let validated = validateAddPersonArgs(args)
			let result = await apiClient.addPerson(validated.name)
			return successResult(result)
		},

		list_people: async () => {
			let result = await apiClient.listPeople()
			return successResult(result)
		},

		get_person: async args => {
			let validated = validateGetPersonArgs(args)
			let person = await apiClient.getPerson(validated.id)
			return {
				content: [{ type: 'text', text: `${person.name}, ${person.age ?? '?'}, ${person.location ?? 'unknown location'}` }],
				structuredContent: { person },
			}
		},

		update_person: async args => {
			let validated = validateUpdatePersonArgs(args)
			let { id, ...updates } = validated
			let result = await apiClient.updatePerson(id, updates)
			return successResult(result)
		},

		create_introduction: async args => {
			let validated = validateCreateIntroductionArgs(args)
			let result = await apiClient.createIntroduction(
				validated.person_a_id,
				validated.person_b_id,
				validated.notes
			)
			return successResult(result)
		},

		list_introductions: async () => {
			let [introductions, people] = await Promise.all([
				apiClient.listIntroductions(),
				apiClient.listPeople(),
			])
			const personMap = Object.fromEntries(people.map(p => [p.id, p]))
			let enriched = introductions.map(intro => ({
				...intro,
				person_a: personMap[intro.person_a_id] ?? null,
				person_b: personMap[intro.person_b_id] ?? null,
			}))
			return {
				content: [{ type: 'text', text: `${introductions.length} introduction${introductions.length === 1 ? '' : 's'}` }],
				structuredContent: { introductions: enriched },
			}
		},

		update_introduction: async args => {
			let validated = validateUpdateIntroductionArgs(args)
			let { id, ...updates } = validated
			let result = await apiClient.updateIntroduction(id, updates)
			return successResult(result)
		},

		find_matches: async args => {
			let validated = validateFindMatchesArgs(args)
			let raw = await apiClient.findMatches(validated.person_id)
			let matches = raw.map(m => ({
				person: m.person,
				about: m.about ?? (m.match_reasons ?? []).slice(0, 2).join('. '),
				matchmaker_note: m.matchmaker_note ?? (m.match_reasons ?? []).slice(2).join(' '),
			}))
			return {
				content: [{ type: 'text', text: `Found ${matches.length} match${matches.length === 1 ? '' : 'es'}.` }],
				structuredContent: { matches },
			}
		},

		delete_person: async args => {
			let validated = validateDeletePersonArgs(args)
			let result = await apiClient.deletePerson(validated.id)
			return successResult(result)
		},

		get_introduction: async args => {
			let validated = validateGetIntroductionArgs(args)
			let intro = await apiClient.getIntroduction(validated.id)
			const [person_a, person_b] = await Promise.all([
				apiClient.getPerson(intro.person_a_id).catch(() => null),
				apiClient.getPerson(intro.person_b_id).catch(() => null),
			])
			let enriched = { ...intro, person_a, person_b }
			return {
				content: [{ type: 'text', text: `Introduction between ${enriched.person_a?.name ?? intro.person_a_id} and ${enriched.person_b?.name ?? intro.person_b_id} — status: ${intro.status}` }],
				structuredContent: { introduction: enriched },
			}
		},

		submit_feedback: async args => {
			let validated = validateSubmitFeedbackArgs(args)
			let result = await apiClient.submitFeedback(
				validated.introduction_id,
				validated.from_person_id,
				validated.content,
				validated.sentiment
			)
			return successResult(result)
		},

		list_feedback: async args => {
			let validated = validateListFeedbackArgs(args)
			let feedback = await apiClient.listFeedback(validated.introduction_id)
			const personIds = [...new Set(feedback.map(f => f.from_person_id))]
			const people = await Promise.all(personIds.map(id => apiClient.getPerson(id).catch(() => null)))
			const personMap = Object.fromEntries(personIds.map((id, i) => [id, people[i]]))
			let enriched = feedback.map(f => ({
				...f,
				from_person: personMap[f.from_person_id] ?? null,
			}))
			return {
				content: [{ type: 'text', text: `${feedback.length} feedback response${feedback.length === 1 ? '' : 's'}` }],
				structuredContent: { feedback: enriched, introduction_id: validated.introduction_id },
			}
		},

		get_feedback: async args => {
			let validated = validateGetFeedbackArgs(args)
			let result = await apiClient.getFeedback(validated.id)
			return successResult(result)
		},
	}
}

export function isValidToolName(name: string): name is ToolName {
	let validNames: ToolName[] = [
		'add_person',
		'list_people',
		'get_person',
		'update_person',
		'create_introduction',
		'list_introductions',
		'update_introduction',
		'find_matches',
		'delete_person',
		'get_introduction',
		'submit_feedback',
		'list_feedback',
		'get_feedback',
	]
	return validNames.includes(name as ToolName)
}
