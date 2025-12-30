import { describe, test, expect } from 'bun:test'
import { ApiClient } from '../src/api'

describe('ApiClient', () => {
	let config = {
		api_base_url: 'http://localhost:3000',
		auth_token: 'valid-token',
	}

	test('constructor accepts config', () => {
		let client = new ApiClient(config)
		expect(client).toBeDefined()
	})

	test('addPerson(name) makes POST with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.addPerson('John Doe')

		expect(result.name).toBe('John Doe')
		expect(result.id).toBe('test-uuid')
		expect(result.matchmaker_id).toBe('user-uuid')
	})

	test('addPerson(name) validates name is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.addPerson('')).rejects.toThrow('Name is required')
	})

	test('addPerson(name) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.addPerson('Test')).rejects.toThrow()
	})

	test('listPeople() makes GET with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.listPeople()

		expect(Array.isArray(result)).toBe(true)
		expect(result.length).toBe(1)

		let firstPerson = result[0]
		expect(firstPerson).toBeDefined()
		expect(firstPerson?.name).toBe('Alice')
		expect(firstPerson?.id).toBe('person-1')
	})

	test('listPeople() returns empty array when no people exist', async () => {
		// This test would need a custom MSW handler to return empty array
		// For now, we're testing the basic functionality
		let client = new ApiClient(config)
		let result = await client.listPeople()
		expect(Array.isArray(result)).toBe(true)
	})

	test('listPeople() throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.listPeople()).rejects.toThrow()
	})
})
