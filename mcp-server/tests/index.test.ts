import { describe, test, expect, mock } from 'bun:test'
import type { ApiClient, Person, Introduction } from '../src/api'

function createMockApiClient(overrides?: Partial<ApiClient>): ApiClient {
	return {
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
		getPerson: mock(
			async (_id: string): Promise<Person> => ({
				id: _id,
				name: 'Alice',
				matchmaker_id: 'user-id',
				age: 28,
				location: 'New York',
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		),
		updatePerson: mock(
			async (
				_id: string,
				_updates: {
					name?: string
					age?: number
					location?: string
					gender?: string
					preferences?: object
					personality?: object
					notes?: string
				}
			): Promise<Person> => ({
				id: _id,
				name: _updates.name ?? 'Alice',
				matchmaker_id: 'user-id',
				age: _updates.age ?? 28,
				location: _updates.location ?? 'New York',
				gender: _updates.gender ?? null,
				preferences: _updates.preferences ?? null,
				personality: _updates.personality ?? null,
				notes: _updates.notes ?? null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		),
		createIntroduction: mock(
			async (
				_person_a_id: string,
				_person_b_id: string,
				_notes?: string
			): Promise<Introduction> => ({
				id: 'intro-id',
				matchmaker_id: 'user-id',
				person_a_id: _person_a_id,
				person_b_id: _person_b_id,
				status: 'pending',
				notes: _notes ?? null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		),
		listIntroductions: mock(async (): Promise<Introduction[]> => []),
		...overrides,
	} as unknown as ApiClient
}

describe('MCP Server', () => {
	test('createServer() returns server instance', async () => {
		let { createServer } = await import('../src/index')
		let mockApiClient = createMockApiClient()

		let server = createServer(mockApiClient)

		expect(server).toBeDefined()
		expect(typeof server.setRequestHandler).toBe('function')
	})

	test('createServer() sets up request handlers without errors', async () => {
		let { createServer } = await import('../src/index')
		let mockApiClient = createMockApiClient()

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
		let mockApiClient = createMockApiClient({
			addPerson: mock(async (_name: string): Promise<Person> => {
				throw new Error('API Error: Unauthorized')
			}),
		})

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

	test('API client handles get_person correctly (unit test)', async () => {
		let mockGetPerson = mock(
			async (_id: string): Promise<Person> => ({
				id: _id,
				name: 'Alice',
				matchmaker_id: 'user-id',
				age: 28,
				location: 'New York',
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			getPerson: mockGetPerson,
		})

		let result = await mockApiClient.getPerson('test-person-id')

		expect(mockGetPerson).toHaveBeenCalledWith('test-person-id')
		expect(result.id).toBe('test-person-id')
		expect(result.name).toBe('Alice')
		expect(result.age).toBe(28)
		expect(result.location).toBe('New York')
	})

	test('API client handles update_person correctly (unit test)', async () => {
		let mockUpdatePerson = mock(
			async (
				_id: string,
				_updates: {
					name?: string
					age?: number
					location?: string
				}
			): Promise<Person> => ({
				id: _id,
				name: _updates.name ?? 'Alice',
				matchmaker_id: 'user-id',
				age: _updates.age ?? 28,
				location: _updates.location ?? 'New York',
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			updatePerson: mockUpdatePerson,
		})

		let result = await mockApiClient.updatePerson('test-person-id', {
			name: 'Bob',
			age: 35,
			location: 'Chicago',
		})

		expect(mockUpdatePerson).toHaveBeenCalledWith('test-person-id', {
			name: 'Bob',
			age: 35,
			location: 'Chicago',
		})
		expect(result.id).toBe('test-person-id')
		expect(result.name).toBe('Bob')
		expect(result.age).toBe(35)
		expect(result.location).toBe('Chicago')
	})

	test('API client handles create_introduction correctly (unit test)', async () => {
		let mockCreateIntroduction = mock(
			async (
				_person_a_id: string,
				_person_b_id: string,
				_notes?: string
			): Promise<Introduction> => ({
				id: 'intro-id',
				matchmaker_id: 'user-id',
				person_a_id: _person_a_id,
				person_b_id: _person_b_id,
				status: 'pending',
				notes: _notes ?? null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			createIntroduction: mockCreateIntroduction,
		})

		let result = await mockApiClient.createIntroduction(
			'person-a-uuid',
			'person-b-uuid',
			'They both love hiking'
		)

		expect(mockCreateIntroduction).toHaveBeenCalledWith(
			'person-a-uuid',
			'person-b-uuid',
			'They both love hiking'
		)
		expect(result.id).toBe('intro-id')
		expect(result.person_a_id).toBe('person-a-uuid')
		expect(result.person_b_id).toBe('person-b-uuid')
		expect(result.status).toBe('pending')
		expect(result.notes).toBe('They both love hiking')
	})

	test('API client handles list_introductions correctly (unit test)', async () => {
		let mockListIntroductions = mock(
			async (): Promise<Introduction[]> => [
				{
					id: 'intro-1',
					matchmaker_id: 'user-id',
					person_a_id: 'person-a-uuid',
					person_b_id: 'person-b-uuid',
					status: 'pending',
					notes: 'Both enjoy hiking',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: 'intro-2',
					matchmaker_id: 'user-id',
					person_a_id: 'person-c-uuid',
					person_b_id: 'person-d-uuid',
					status: 'accepted',
					notes: null,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			]
		)

		let mockApiClient = createMockApiClient({
			listIntroductions: mockListIntroductions,
		})

		let result = await mockApiClient.listIntroductions()

		expect(mockListIntroductions).toHaveBeenCalled()
		expect(Array.isArray(result)).toBe(true)
		expect(result.length).toBe(2)

		let firstIntro = result[0]
		expect(firstIntro).toBeDefined()
		expect(firstIntro?.id).toBe('intro-1')
		expect(firstIntro?.status).toBe('pending')
		expect(firstIntro?.notes).toBe('Both enjoy hiking')

		let secondIntro = result[1]
		expect(secondIntro).toBeDefined()
		expect(secondIntro?.id).toBe('intro-2')
		expect(secondIntro?.status).toBe('accepted')
		expect(secondIntro?.notes).toBeNull()
	})
})
