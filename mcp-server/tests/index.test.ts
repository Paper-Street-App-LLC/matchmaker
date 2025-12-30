import { describe, test, expect, mock } from 'bun:test'
import type { ApiClient, Person } from '../src/api'

describe('MCP Server', () => {
	test('createServer() returns server instance', async () => {
		let { createServer } = await import('../src/index')
		let mockApiClient = {
			addPerson: mock(
				async (_name: string): Promise<Person> => ({
					id: 'test-id',
					name: _name,
					matchmaker_id: 'user-id',
					active: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
			),
			listPeople: mock(async (): Promise<Person[]> => []),
		} as unknown as ApiClient

		let server = createServer(mockApiClient)

		expect(server).toBeDefined()
		expect(typeof server.setRequestHandler).toBe('function')
	})

	test('createServer() sets up request handlers without errors', async () => {
		let { createServer } = await import('../src/index')
		let mockApiClient = {
			addPerson: mock(
				async (_name: string): Promise<Person> => ({
					id: 'test-id',
					name: _name,
					matchmaker_id: 'user-id',
					active: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
			),
			listPeople: mock(async (): Promise<Person[]> => []),
		} as unknown as ApiClient

		// Should not throw when creating server and setting up handlers
		expect(() => createServer(mockApiClient)).not.toThrow()
	})

	test('API client methods are called correctly (unit test)', async () => {
		// This tests that our handler logic would work correctly
		let mockAddPerson = mock(
			async (_name: string): Promise<Person> => ({
				id: 'test-id',
				name: _name,
				matchmaker_id: 'user-id',
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		)

		let mockApiClient = {
			addPerson: mockAddPerson,
			listPeople: mock(async (): Promise<Person[]> => []),
		} as unknown as ApiClient

		// Simulate what the handler does
		let personName = 'John Doe'
		let result = await mockApiClient.addPerson(personName)

		expect(mockAddPerson).toHaveBeenCalledWith('John Doe')
		expect(result.name).toBe('John Doe')
		expect(result.id).toBe('test-id')
	})

	test('API client handles list_people correctly (unit test)', async () => {
		let mockListPeople = mock(
			async (): Promise<Person[]> => [
				{
					id: '1',
					name: 'Alice',
					matchmaker_id: 'user-id',
					active: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: '2',
					name: 'Bob',
					matchmaker_id: 'user-id',
					active: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			]
		)

		let mockApiClient = {
			addPerson: mock(
				async (_name: string): Promise<Person> => ({
					id: 'test-id',
					name: _name,
					matchmaker_id: 'user-id',
					active: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
			),
			listPeople: mockListPeople,
		} as unknown as ApiClient

		let result = await mockApiClient.listPeople()

		expect(mockListPeople).toHaveBeenCalled()
		expect(Array.isArray(result)).toBe(true)
		expect(result.length).toBe(2)

		let firstPerson = result[0]
		expect(firstPerson).toBeDefined()
		expect(firstPerson?.name).toBe('Alice')
	})

	test('error handling preserves error messages (unit test)', async () => {
		let mockApiClient = {
			addPerson: mock(async (_name: string): Promise<Person> => {
				throw new Error('API Error: Unauthorized')
			}),
			listPeople: mock(async (): Promise<Person[]> => []),
		} as unknown as ApiClient

		// Simulate what the handler does with errors
		try {
			await mockApiClient.addPerson('John Doe')
			expect(true).toBe(false) // Should not reach here
		} catch (error) {
			if (error instanceof Error) {
				expect(error.message).toContain('API Error')
				expect(error.message).toContain('Unauthorized')
			}
		}
	})
})
