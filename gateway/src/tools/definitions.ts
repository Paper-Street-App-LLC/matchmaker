import type Anthropic from '@anthropic-ai/sdk'

export let toolDefinitions: Anthropic.Tool[] = [
	{
		name: 'add_person',
		description: 'Add a new person to the matchmaker',
		input_schema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Person name' },
			},
			required: ['name'],
		},
	},
	{
		name: 'list_people',
		description: 'List all people in the matchmaker',
		input_schema: {
			type: 'object',
			properties: {},
		},
	},
	{
		name: 'get_person',
		description: 'Retrieve detailed information about a specific person',
		input_schema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Person ID (UUID)' },
			},
			required: ['id'],
		},
	},
	{
		name: 'update_person',
		description:
			"Update a person's profile information. Use the structured preferences format for the `preferences` field: { aboutMe: { height (cm), build ('slim'|'athletic'|'average'|'curvy'|'heavyset'), fitnessLevel ('sedentary'|'light'|'moderate'|'active'|'very_active'), ethnicity, religion, hasChildren, numberOfChildren, isDivorced, hasTattoos, hasPiercings, isSmoker, occupation, income ('<30k'|'30k-60k'|'60k-100k'|'100k-200k'|'>200k') }, lookingFor: { ageRange: { min, max }, heightRange: { min, max }, fitnessPreference, ethnicityPreference, incomePreference, religionRequired, wantsChildren }, dealBreakers: string[] }",
		input_schema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Person ID (UUID)' },
				name: { type: 'string', description: 'Person name' },
				age: { type: 'number', description: 'Person age' },
				location: { type: 'string', description: 'Person location' },
				gender: { type: 'string', description: 'Person gender' },
				preferences: {
					type: 'object',
					description: 'Structured preferences with aboutMe, lookingFor, and dealBreakers sections',
				},
				personality: { type: 'object', description: 'Person personality traits' },
				notes: { type: 'string', description: 'Notes about the person' },
			},
			required: ['id'],
		},
	},
	{
		name: 'create_introduction',
		description:
			'Create an introduction between two people. Supports cross-matchmaker introductions where each person belongs to a different matchmaker. You must own at least one person.',
		input_schema: {
			type: 'object',
			properties: {
				person_a_id: { type: 'string', description: 'First person ID (UUID)' },
				person_b_id: { type: 'string', description: 'Second person ID (UUID)' },
				notes: { type: 'string', description: 'Notes about the introduction' },
			},
			required: ['person_a_id', 'person_b_id'],
		},
	},
	{
		name: 'list_introductions',
		description:
			'List all introductions where you are either matchmaker (includes cross-matchmaker introductions)',
		input_schema: {
			type: 'object',
			properties: {},
		},
	},
	{
		name: 'update_introduction',
		description: 'Update introduction status or notes',
		input_schema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Introduction ID (UUID)' },
				status: {
					type: 'string',
					enum: ['pending', 'accepted', 'declined', 'dating', 'ended'],
					description: 'Introduction status',
				},
				notes: { type: 'string', description: 'Notes about the introduction' },
			},
			required: ['id'],
		},
	},
	{
		name: 'find_matches',
		description:
			"Find compatible matches for a person. Searches across all active people including seed profiles and other matchmakers' clients (cross-matchmaker). Automatically excludes candidates the matchmaker has already reviewed.",
		input_schema: {
			type: 'object',
			properties: {
				person_id: {
					type: 'string',
					description: 'Person ID (UUID) to find matches for',
				},
			},
			required: ['person_id'],
		},
	},
	{
		name: 'record_decision',
		description:
			"Record a matchmaker's accept or decline decision on a candidate match. Declined candidates are excluded from future find_matches results for this person.",
		input_schema: {
			type: 'object',
			properties: {
				person_id: {
					type: 'string',
					description: 'Person ID (UUID) -- the person being matched',
				},
				candidate_id: {
					type: 'string',
					description: 'Candidate ID (UUID) -- the match candidate',
				},
				decision: {
					type: 'string',
					enum: ['accepted', 'declined'],
					description: 'Whether to accept or decline this candidate',
				},
				decline_reason: {
					type: 'string',
					description: 'Optional reason for declining (used to improve future suggestions)',
				},
			},
			required: ['person_id', 'candidate_id', 'decision'],
		},
	},
	{
		name: 'list_decisions',
		description: 'List all match decisions recorded for a specific person',
		input_schema: {
			type: 'object',
			properties: {
				person_id: {
					type: 'string',
					description: 'Person ID (UUID)',
				},
			},
			required: ['person_id'],
		},
	},
	{
		name: 'delete_person',
		description: 'Soft-delete a person (sets active=false)',
		input_schema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Person ID (UUID)' },
			},
			required: ['id'],
		},
	},
	{
		name: 'get_introduction',
		description: 'Get details of a specific introduction',
		input_schema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Introduction ID (UUID)' },
			},
			required: ['id'],
		},
	},
	{
		name: 'submit_feedback',
		description: 'Submit feedback about an introduction',
		input_schema: {
			type: 'object',
			properties: {
				introduction_id: { type: 'string', description: 'Introduction ID (UUID)' },
				from_person_id: {
					type: 'string',
					description: 'Person ID (UUID) submitting the feedback',
				},
				content: { type: 'string', description: 'Feedback content' },
				sentiment: {
					type: 'string',
					description: 'Feedback sentiment (e.g., positive, negative, neutral)',
				},
			},
			required: ['introduction_id', 'from_person_id', 'content'],
		},
	},
	{
		name: 'list_feedback',
		description: 'Get all feedback for a specific introduction',
		input_schema: {
			type: 'object',
			properties: {
				introduction_id: { type: 'string', description: 'Introduction ID (UUID)' },
			},
			required: ['introduction_id'],
		},
	},
	{
		name: 'get_feedback',
		description: 'Get a specific feedback record',
		input_schema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'Feedback ID (UUID)' },
			},
			required: ['id'],
		},
	},
]

export type ToolName = (typeof toolDefinitions)[number]['name']
