import type { IApiClient } from './api.js'
import {
	buildPersonCard,
	buildMatchList,
	buildIntroductionList,
	buildIntroductionCard,
	widgetResult,
} from './widgets.js'
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
	isError?: boolean
	structuredContent?: Record<string, unknown>
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
			let result = await apiClient.getPerson(validated.id)
			return widgetResult(result, buildPersonCard(result))
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
			let [intros, people] = await Promise.all([
				apiClient.listIntroductions(),
				apiClient.listPeople(),
			])
			let personMap = new Map(people.map(p => [p.id, p.name]))
			return widgetResult(intros, buildIntroductionList(intros, personMap))
		},

		update_introduction: async args => {
			let validated = validateUpdateIntroductionArgs(args)
			let { id, ...updates } = validated
			let result = await apiClient.updateIntroduction(id, updates)
			return successResult(result)
		},

		find_matches: async args => {
			let validated = validateFindMatchesArgs(args)
			let result = await apiClient.findMatches(validated.person_id)
			return widgetResult(result, buildMatchList(result))
		},

		delete_person: async args => {
			let validated = validateDeletePersonArgs(args)
			let result = await apiClient.deletePerson(validated.id)
			return successResult(result)
		},

		get_introduction: async args => {
			let validated = validateGetIntroductionArgs(args)
			let intro = await apiClient.getIntroduction(validated.id)
			let [personAResult, personBResult] = await Promise.allSettled([
				apiClient.getPerson(intro.person_a_id),
				apiClient.getPerson(intro.person_b_id),
			])
			let personA = personAResult.status === 'fulfilled' ? personAResult.value : null
			let personB = personBResult.status === 'fulfilled' ? personBResult.value : null
			return widgetResult(intro, buildIntroductionCard(intro, personA, personB))
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
			let result = await apiClient.listFeedback(validated.introduction_id)
			return successResult(result)
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
