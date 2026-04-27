import type { IApiClient } from './api.js'
import {
	buildPersonCard,
	buildMatchList,
	buildIntroductionList,
	buildIntroductionCard,
	buildFeedbackList,
	widgetResult,
} from './widgets.js'
import { getToolDefinition, toolRegistry, type ToolName } from '@matchmaker/shared'

type ToolResult = {
	content: Array<{ type: 'text'; text: string }>
	isError?: boolean
	structuredContent?: Record<string, unknown>
}

type ToolHandler = (args: unknown) => Promise<ToolResult>

function successResult(data: unknown): ToolResult {
	return {
		content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
	}
}

// Parses raw tool args against the shared registry's Zod schema.
function parseArgs<T>(name: ToolName, args: unknown): T {
	let definition = getToolDefinition(name)
	if (!definition) throw new Error(`Unknown tool: ${name}`)
	return definition.inputSchema.parse(args ?? {}) as T
}

export function createToolHandlers(apiClient: IApiClient): Record<ToolName, ToolHandler> {
	return {
		add_person: async args => {
			let { name } = parseArgs<{ name: string }>('add_person', args)
			let result = await apiClient.addPerson(name)
			return successResult(result)
		},

		list_people: async () => {
			let result = await apiClient.listPeople()
			return successResult(result)
		},

		get_person: async args => {
			let { id } = parseArgs<{ id: string }>('get_person', args)
			let result = await apiClient.getPerson(id)
			return widgetResult(result, buildPersonCard(result))
		},

		update_person: async args => {
			let { id, ...updates } = parseArgs<{
				id: string
				name?: string
				age?: number
				location?: string
				gender?: string
				preferences?: Record<string, unknown>
				personality?: Record<string, unknown>
				notes?: string
			}>('update_person', args)
			let result = await apiClient.updatePerson(id, updates)
			return successResult(result)
		},

		delete_person: async args => {
			let { id } = parseArgs<{ id: string }>('delete_person', args)
			let result = await apiClient.deletePerson(id)
			return successResult(result)
		},

		create_introduction: async args => {
			let { person_a_id, person_b_id, notes } = parseArgs<{
				person_a_id: string
				person_b_id: string
				notes?: string
			}>('create_introduction', args)
			let result = await apiClient.createIntroduction(person_a_id, person_b_id, notes)
			return successResult(result)
		},

		list_introductions: async () => {
			let [intros, people] = await Promise.all([
				apiClient.listIntroductions(),
				apiClient.listPeople(),
			])
			let personMap = new Map(people.map(p => [p.id, p.name]))
			return widgetResult(intros, buildIntroductionList(intros, personMap))
		},

		update_introduction: async args => {
			let { id, ...updates } = parseArgs<{
				id: string
				status?: 'pending' | 'accepted' | 'declined' | 'dating' | 'ended'
				notes?: string
			}>('update_introduction', args)
			let result = await apiClient.updateIntroduction(id, updates)
			return successResult(result)
		},

		get_introduction: async args => {
			let { id } = parseArgs<{ id: string }>('get_introduction', args)
			let intro = await apiClient.getIntroduction(id)
			let [personAResult, personBResult] = await Promise.allSettled([
				apiClient.getPerson(intro.person_a_id),
				apiClient.getPerson(intro.person_b_id),
			])
			let personA = personAResult.status === 'fulfilled' ? personAResult.value : null
			let personB = personBResult.status === 'fulfilled' ? personBResult.value : null
			return widgetResult(intro, buildIntroductionCard(intro, personA, personB))
		},

		find_matches: async args => {
			let { person_id } = parseArgs<{ person_id: string }>('find_matches', args)
			let result = await apiClient.findMatches(person_id)
			return widgetResult(result, buildMatchList(result))
		},

		record_decision: async args => {
			let { person_id, candidate_id, decision, decline_reason } = parseArgs<{
				person_id: string
				candidate_id: string
				decision: 'accepted' | 'declined'
				decline_reason?: string
			}>('record_decision', args)
			let result = await apiClient.recordDecision(
				person_id,
				candidate_id,
				decision,
				decline_reason
			)
			return successResult(result)
		},

		list_decisions: async args => {
			let { person_id } = parseArgs<{ person_id: string }>('list_decisions', args)
			let result = await apiClient.listDecisions(person_id)
			return successResult(result)
		},

		submit_feedback: async args => {
			let { introduction_id, from_person_id, content, sentiment } = parseArgs<{
				introduction_id: string
				from_person_id: string
				content: string
				sentiment?: string
			}>('submit_feedback', args)
			let result = await apiClient.submitFeedback(
				introduction_id,
				from_person_id,
				content,
				sentiment
			)
			return successResult(result)
		},

		list_feedback: async args => {
			let { introduction_id } = parseArgs<{ introduction_id: string }>('list_feedback', args)
			let feedbackList = await apiClient.listFeedback(introduction_id)

			// Deduplicate person IDs and resolve names
			let uniquePersonIds = [...new Set(feedbackList.map(f => f.from_person_id))]
			let results = await Promise.allSettled(
				uniquePersonIds.map(id => apiClient.getPerson(id))
			)
			let personMap = new Map<string, string>()
			results.forEach((result, i) => {
				if (result.status === 'fulfilled') {
					personMap.set(uniquePersonIds[i]!, result.value.name)
				}
			})

			return widgetResult(feedbackList, buildFeedbackList(feedbackList, personMap))
		},

		get_feedback: async args => {
			let { id } = parseArgs<{ id: string }>('get_feedback', args)
			let result = await apiClient.getFeedback(id)
			return successResult(result)
		},
	}
}

let validToolNames = new Set<string>(toolRegistry.map(t => t.name))

export function isValidToolName(name: string): name is ToolName {
	return validToolNames.has(name)
}
