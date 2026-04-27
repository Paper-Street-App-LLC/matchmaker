import { z } from 'zod'
import {
	BUILDS,
	FITNESS_LEVELS,
	INCOMES,
	FITNESS_PREFERENCES,
	INCOME_PREFERENCES,
	DEAL_BREAKERS,
} from '../domain/preferences.js'

export type ToolDefinition = {
	name: string
	description: string
	inputSchema: z.ZodObject
}

let aboutMeShape = z.object({
	height: z.number().optional(),
	build: z.enum(BUILDS).optional(),
	fitnessLevel: z.enum(FITNESS_LEVELS).optional(),
	ethnicity: z.string().optional(),
	religion: z.string().optional(),
	hasChildren: z.boolean().optional(),
	numberOfChildren: z.number().optional(),
	isDivorced: z.boolean().optional(),
	hasTattoos: z.boolean().optional(),
	hasPiercings: z.boolean().optional(),
	isSmoker: z.boolean().optional(),
	occupation: z.string().optional(),
	income: z.enum(INCOMES).optional(),
})

let lookingForShape = z.object({
	ageRange: z
		.object({ min: z.number().optional(), max: z.number().optional() })
		.optional(),
	heightRange: z
		.object({ min: z.number().optional(), max: z.number().optional() })
		.optional(),
	fitnessPreference: z.enum(FITNESS_PREFERENCES).optional(),
	ethnicityPreference: z.array(z.string()).optional(),
	incomePreference: z.enum(INCOME_PREFERENCES).optional(),
	religionRequired: z.string().nullable().optional(),
	wantsChildren: z.boolean().nullable().optional(),
})

let preferencesShape = z.object({
	aboutMe: aboutMeShape.optional(),
	lookingFor: lookingForShape.optional(),
	dealBreakers: z.array(z.enum(DEAL_BREAKERS)).optional(),
})

let addPerson: ToolDefinition = {
	name: 'add_person',
	description: 'Add a new person to the matchmaker',
	inputSchema: z.object({
		name: z.string().describe('Person name'),
	}),
}

let listPeople: ToolDefinition = {
	name: 'list_people',
	description: 'List all people in the matchmaker',
	inputSchema: z.object({}),
}

let getPerson: ToolDefinition = {
	name: 'get_person',
	description: 'Retrieve detailed information about a specific person',
	inputSchema: z.object({
		id: z.string().describe('Person ID (UUID)'),
	}),
}

let updatePerson: ToolDefinition = {
	name: 'update_person',
	description:
		"Update a person's profile information. The preferences field carries structured aboutMe, lookingFor, and dealBreakers sections — see the inputSchema for valid enum values.",
	inputSchema: z.object({
		id: z.string().describe('Person ID (UUID)'),
		name: z.string().optional().describe('Person name'),
		age: z.number().optional().describe('Person age'),
		location: z.string().optional().describe('Person location'),
		gender: z.string().optional().describe('Person gender'),
		preferences: preferencesShape
			.optional()
			.describe('Structured preferences with aboutMe, lookingFor, and dealBreakers sections'),
		personality: z
			.record(z.string(), z.unknown())
			.optional()
			.describe('Person personality traits'),
		notes: z.string().optional().describe('Notes about the person'),
	}),
}

let deletePerson: ToolDefinition = {
	name: 'delete_person',
	description: 'Soft-delete a person (sets active=false)',
	inputSchema: z.object({
		id: z.string().describe('Person ID (UUID)'),
	}),
}

let createIntroduction: ToolDefinition = {
	name: 'create_introduction',
	description:
		'Create an introduction between two people. Supports cross-matchmaker introductions where each person belongs to a different matchmaker. You must own at least one person.',
	inputSchema: z.object({
		person_a_id: z.string().describe('First person ID (UUID)'),
		person_b_id: z.string().describe('Second person ID (UUID)'),
		notes: z.string().optional().describe('Notes about the introduction'),
	}),
}

let listIntroductions: ToolDefinition = {
	name: 'list_introductions',
	description:
		'List all introductions where you are either matchmaker (includes cross-matchmaker introductions)',
	inputSchema: z.object({}),
}

let updateIntroduction: ToolDefinition = {
	name: 'update_introduction',
	description: 'Update introduction status or notes',
	inputSchema: z.object({
		id: z.string().describe('Introduction ID (UUID)'),
		status: z
			.enum(['pending', 'accepted', 'declined', 'dating', 'ended'])
			.optional()
			.describe('Introduction status'),
		notes: z.string().optional().describe('Notes about the introduction'),
	}),
}

let getIntroduction: ToolDefinition = {
	name: 'get_introduction',
	description: 'Get details of a specific introduction',
	inputSchema: z.object({
		id: z.string().describe('Introduction ID (UUID)'),
	}),
}

let findMatches: ToolDefinition = {
	name: 'find_matches',
	description:
		"Find compatible matches for a person. Searches across all active people including seed profiles and other matchmakers' clients (cross-matchmaker). Automatically excludes candidates the matchmaker has already reviewed.",
	inputSchema: z.object({
		person_id: z.string().describe('Person ID (UUID) to find matches for'),
	}),
}

let recordDecision: ToolDefinition = {
	name: 'record_decision',
	description:
		"Record a matchmaker's accept or decline decision on a candidate match. Declined candidates are excluded from future find_matches results for this person.",
	inputSchema: z.object({
		person_id: z.string().describe('Person ID (UUID) — the person being matched'),
		candidate_id: z.string().describe('Candidate ID (UUID) — the match candidate'),
		decision: z
			.enum(['accepted', 'declined'])
			.describe('Whether to accept or decline this candidate'),
		decline_reason: z
			.string()
			.optional()
			.describe('Optional reason for declining (used to improve future suggestions)'),
	}),
}

let listDecisions: ToolDefinition = {
	name: 'list_decisions',
	description: 'List all match decisions recorded for a specific person',
	inputSchema: z.object({
		person_id: z.string().describe('Person ID (UUID)'),
	}),
}

let submitFeedback: ToolDefinition = {
	name: 'submit_feedback',
	description: 'Submit feedback about an introduction',
	inputSchema: z.object({
		introduction_id: z.string().describe('Introduction ID (UUID)'),
		from_person_id: z.string().describe('Person ID (UUID) submitting the feedback'),
		content: z.string().describe('Feedback content'),
		sentiment: z
			.string()
			.optional()
			.describe('Feedback sentiment (e.g., positive, negative, neutral)'),
	}),
}

let listFeedback: ToolDefinition = {
	name: 'list_feedback',
	description: 'Get all feedback for a specific introduction',
	inputSchema: z.object({
		introduction_id: z.string().describe('Introduction ID (UUID)'),
	}),
}

let getFeedback: ToolDefinition = {
	name: 'get_feedback',
	description: 'Get a specific feedback record',
	inputSchema: z.object({
		id: z.string().describe('Feedback ID (UUID)'),
	}),
}

export let toolRegistry = [
	addPerson,
	listPeople,
	getPerson,
	updatePerson,
	deletePerson,
	createIntroduction,
	listIntroductions,
	updateIntroduction,
	getIntroduction,
	findMatches,
	recordDecision,
	listDecisions,
	submitFeedback,
	listFeedback,
	getFeedback,
] as const satisfies ReadonlyArray<ToolDefinition>

export type ToolName = (typeof toolRegistry)[number]['name']

export function getToolDefinition(name: string): ToolDefinition | undefined {
	return toolRegistry.find(t => t.name === name)
}

export type McpToolDefinition = {
	name: string
	description: string
	inputSchema: Record<string, unknown>
}

// Derives the MCP-SDK-shaped tool list (with JSON Schema input shapes) from the
// Zod registry. Both transports consume this so that adding or renaming a tool
// requires editing the registry only.
export function buildMcpToolList(): McpToolDefinition[] {
	return toolRegistry.map(t => {
		let { $schema, ...inputSchema } = z.toJSONSchema(t.inputSchema) as Record<string, unknown>
		return {
			name: t.name,
			description: t.description,
			inputSchema,
		}
	})
}
