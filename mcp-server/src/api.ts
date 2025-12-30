import { z } from 'zod'
import type { Config } from './config'

let addPersonInputSchema = z.object({
	name: z.string().min(1, 'Name is required'),
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

export class ApiClient {
	constructor(private config: Config) {}

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

		return response.json() as Promise<Person>
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

		return response.json() as Promise<Person[]>
	}
}

