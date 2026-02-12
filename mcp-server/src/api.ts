import { z } from 'zod'
import type { Config } from './config'
import {
	personResponseSchema,
	peopleListResponseSchema,
	introductionResponseSchema,
	introductionsListResponseSchema,
	matchesListResponseSchema,
	feedbackResponseSchema,
	feedbackListResponseSchema,
} from './schemas'

let addPersonInputSchema = z.object({
	name: z.string().min(1, 'Name is required'),
})

let getPersonInputSchema = z.object({
	id: z.string().min(1, 'ID is required'),
})

let updatePersonInputSchema = z.object({
	id: z.string().min(1, 'ID is required'),
	name: z.string().min(1).optional(),
	age: z.number().int().positive().optional(),
	location: z.string().optional(),
	gender: z.string().optional(),
	preferences: z.record(z.unknown()).optional(),
	personality: z.record(z.unknown()).optional(),
	notes: z.string().optional(),
})

let createIntroductionInputSchema = z.object({
	person_a_id: z.string().uuid('person_a_id must be a valid UUID'),
	person_b_id: z.string().uuid('person_b_id must be a valid UUID'),
	notes: z.string().optional(),
})

let updateIntroductionInputSchema = z.object({
	id: z.string().min(1, 'ID is required'),
	status: z.enum(['pending', 'accepted', 'declined', 'dating', 'ended']).optional(),
	notes: z.string().optional(),
})

let findMatchesInputSchema = z.object({
	person_id: z.string().min(1, 'Person ID is required'),
})

let deletePersonInputSchema = z.object({
	id: z.string().min(1, 'ID is required'),
})

let getIntroductionInputSchema = z.object({
	id: z.string().min(1, 'ID is required'),
})

let submitFeedbackInputSchema = z.object({
	introduction_id: z.string().uuid('introduction_id must be a valid UUID'),
	from_person_id: z.string().uuid('from_person_id must be a valid UUID'),
	content: z.string().min(1, 'Content is required'),
	sentiment: z.string().optional(),
})

let listFeedbackInputSchema = z.object({
	introduction_id: z.string().min(1, 'Introduction ID is required'),
})

let getFeedbackInputSchema = z.object({
	id: z.string().min(1, 'ID is required'),
})

export interface PersonPreferences {
	aboutMe?: {
		height?: number
		build?: 'slim' | 'average' | 'athletic' | 'heavy'
		fitnessLevel?: 'active' | 'average' | 'sedentary'
		ethnicity?: string
		religion?: string
		hasChildren?: boolean
		numberOfChildren?: number
		isDivorced?: boolean
		hasTattoos?: boolean
		hasPiercings?: boolean
		isSmoker?: boolean
		occupation?: string
	}
	lookingFor?: {
		ageRange?: { min?: number; max?: number }
		heightRange?: { min?: number; max?: number }
		fitnessPreference?: 'active' | 'average' | 'any'
		ethnicityPreference?: string[]
		incomePreference?: 'high' | 'moderate' | 'any'
		religionRequired?: string | null
		wantsChildren?: boolean | null
	}
	dealBreakers?: string[]
	[key: string]: unknown
}

export interface PersonPersonality {
	traits?: string[]
	interests?: string[]
	[key: string]: unknown
}

export interface Person {
	id: string
	name: string
	matchmaker_id: string
	age?: number | null
	location?: string | null
	gender?: string | null
	preferences?: PersonPreferences | null
	personality?: PersonPersonality | null
	notes?: string | null
	active: boolean
	created_at: string
	updated_at: string
}

export interface Introduction {
	id: string
	matchmaker_a_id: string
	matchmaker_b_id: string
	person_a_id: string
	person_b_id: string
	status: string
	notes?: string | null
	created_at: string
	updated_at: string
}

export interface Match {
	person: {
		id: string
		name: string
		age: number | null
		location: string | null
		gender: string | null
	}
	compatibility_score: number
	match_explanation: string
	is_cross_matchmaker: boolean
}

export interface Feedback {
	id: string
	introduction_id: string
	from_person_id: string
	content: string
	sentiment?: string | null
	created_at: string
}

export class ApiClient {
	constructor(private config: Config) {}

	private async parseResponse<T>(response: Response, schema: z.ZodSchema<T>): Promise<T> {
		let data: unknown
		try {
			data = await response.json()
		} catch (e) {
			throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
		}

		try {
			return schema.parse(data)
		} catch (e) {
			if (e instanceof z.ZodError) {
				throw new Error(`API response validation failed: ${e.errors[0]?.message}`)
			}
			throw e
		}
	}

	async addPerson(name: string): Promise<Person> {
		// Validate input
		addPersonInputSchema.parse({ name })

		let response = await fetch(`${this.config.api_base_url}/api/people`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.config.auth_token}`,
			},
			body: JSON.stringify({ name }),
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, personResponseSchema)
	}

	async listPeople(): Promise<Person[]> {
		let response = await fetch(`${this.config.api_base_url}/api/people`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.config.auth_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, peopleListResponseSchema)
	}

	async getPerson(id: string): Promise<Person> {
		// Validate input
		getPersonInputSchema.parse({ id })

		let response = await fetch(`${this.config.api_base_url}/api/people/${id}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.config.auth_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, personResponseSchema)
	}

	async updatePerson(
		id: string,
		updates: {
			name?: string
			age?: number
			location?: string
			gender?: string
			preferences?: PersonPreferences
			personality?: PersonPersonality
			notes?: string
		}
	): Promise<Person> {
		// Validate input
		updatePersonInputSchema.parse({ id, ...updates })

		let response = await fetch(`${this.config.api_base_url}/api/people/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.config.auth_token}`,
			},
			body: JSON.stringify(updates),
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, personResponseSchema)
	}

	async createIntroduction(
		person_a_id: string,
		person_b_id: string,
		notes?: string
	): Promise<Introduction> {
		// Validate input
		createIntroductionInputSchema.parse({ person_a_id, person_b_id, notes })

		let body: { person_a_id: string; person_b_id: string; notes?: string } = {
			person_a_id,
			person_b_id,
		}
		if (notes !== undefined) {
			body.notes = notes
		}

		let response = await fetch(`${this.config.api_base_url}/api/introductions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.config.auth_token}`,
			},
			body: JSON.stringify(body),
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, introductionResponseSchema)
	}

	async listIntroductions(): Promise<Introduction[]> {
		let response = await fetch(`${this.config.api_base_url}/api/introductions`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.config.auth_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, introductionsListResponseSchema)
	}

	async updateIntroduction(
		id: string,
		updates: {
			status?: 'pending' | 'accepted' | 'declined' | 'dating' | 'ended'
			notes?: string
		}
	): Promise<Introduction> {
		// Validate input
		updateIntroductionInputSchema.parse({ id, ...updates })

		let response = await fetch(`${this.config.api_base_url}/api/introductions/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.config.auth_token}`,
			},
			body: JSON.stringify(updates),
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, introductionResponseSchema)
	}

	async findMatches(personId: string): Promise<Match[]> {
		// Validate input
		findMatchesInputSchema.parse({ person_id: personId })

		let response = await fetch(`${this.config.api_base_url}/api/matches/${personId}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.config.auth_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, matchesListResponseSchema)
	}

	async deletePerson(id: string): Promise<Person> {
		// Validate input
		deletePersonInputSchema.parse({ id })

		let response = await fetch(`${this.config.api_base_url}/api/people/${id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${this.config.auth_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, personResponseSchema)
	}

	async getIntroduction(id: string): Promise<Introduction> {
		// Validate input
		getIntroductionInputSchema.parse({ id })

		let response = await fetch(`${this.config.api_base_url}/api/introductions/${id}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.config.auth_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, introductionResponseSchema)
	}

	async submitFeedback(
		introduction_id: string,
		from_person_id: string,
		content: string,
		sentiment?: string
	): Promise<Feedback> {
		// Validate input
		submitFeedbackInputSchema.parse({ introduction_id, from_person_id, content, sentiment })

		let body: {
			introduction_id: string
			from_person_id: string
			content: string
			sentiment?: string
		} = {
			introduction_id,
			from_person_id,
			content,
		}
		if (sentiment !== undefined) {
			body.sentiment = sentiment
		}

		let response = await fetch(`${this.config.api_base_url}/api/feedback`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.config.auth_token}`,
			},
			body: JSON.stringify(body),
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, feedbackResponseSchema)
	}

	async listFeedback(introduction_id: string): Promise<Feedback[]> {
		// Validate input
		listFeedbackInputSchema.parse({ introduction_id })

		let response = await fetch(
			`${this.config.api_base_url}/api/feedback?introductionId=${encodeURIComponent(introduction_id)}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.config.auth_token}`,
				},
			}
		)

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, feedbackListResponseSchema)
	}

	async getFeedback(id: string): Promise<Feedback> {
		// Validate input
		getFeedbackInputSchema.parse({ id })

		let response = await fetch(`${this.config.api_base_url}/api/feedback/${id}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.config.auth_token}`,
			},
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}

		return this.parseResponse(response, feedbackResponseSchema)
	}
}
