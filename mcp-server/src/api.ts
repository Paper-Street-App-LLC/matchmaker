import { z } from 'zod'
import type { Config } from './config'
import {
	personResponseSchema,
	peopleListResponseSchema,
	introductionResponseSchema,
	introductionsListResponseSchema,
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

export interface Person {
	id: string
	name: string
	matchmaker_id: string
	age?: number | null
	location?: string | null
	gender?: string | null
	preferences?: object | null
	personality?: object | null
	notes?: string | null
	active: boolean
	created_at: string
	updated_at: string
}

export interface Introduction {
	id: string
	matchmaker_id: string
	person_a_id: string
	person_b_id: string
	status: string
	notes?: string | null
	created_at: string
	updated_at: string
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
			preferences?: object
			personality?: object
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
}
