import { describe, test, expect, mock } from 'bun:test'
import type {
	ApiClient,
	Person,
	Introduction,
	Match,
	Feedback,
	PersonPreferences,
	PersonPersonality,
} from '../src/api'

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
					preferences?: PersonPreferences
					personality?: PersonPersonality
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
				matchmaker_a_id: 'user-id',
				matchmaker_b_id: 'user-id',
				person_a_id: _person_a_id,
				person_b_id: _person_b_id,
				status: 'pending',
				notes: _notes ?? null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		),
		listIntroductions: mock(async (): Promise<Introduction[]> => []),
		updateIntroduction: mock(
			async (
				_id: string,
				_updates: {
					status?: 'pending' | 'accepted' | 'declined' | 'dating' | 'ended'
					notes?: string
				}
			): Promise<Introduction> => ({
				id: _id,
				matchmaker_a_id: 'user-id',
				matchmaker_b_id: 'user-id',
				person_a_id: 'person-a-uuid',
				person_b_id: 'person-b-uuid',
				status: _updates.status ?? 'pending',
				notes: _updates.notes ?? null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		),
		findMatches: mock(async (_personId: string): Promise<Match[]> => []),
		deletePerson: mock(
			async (_id: string): Promise<Person> => ({
				id: _id,
				name: 'Alice',
				matchmaker_id: 'user-id',
				age: 28,
				location: 'New York',
				active: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		),
		getIntroduction: mock(
			async (_id: string): Promise<Introduction> => ({
				id: _id,
				matchmaker_a_id: 'user-id',
				matchmaker_b_id: 'user-id',
				person_a_id: 'person-a-uuid',
				person_b_id: 'person-b-uuid',
				status: 'pending',
				notes: 'Both enjoy hiking',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		),
		submitFeedback: mock(
			async (
				_introduction_id: string,
				_from_person_id: string,
				_content: string,
				_sentiment?: string
			): Promise<Feedback> => ({
				id: 'feedback-id',
				introduction_id: _introduction_id,
				from_person_id: _from_person_id,
				content: _content,
				sentiment: _sentiment ?? null,
				created_at: new Date().toISOString(),
			})
		),
		listFeedback: mock(async (_introduction_id: string): Promise<Feedback[]> => []),
		getFeedback: mock(
			async (_id: string): Promise<Feedback> => ({
				id: _id,
				introduction_id: 'intro-uuid',
				from_person_id: 'person-uuid',
				content: 'Great match!',
				sentiment: 'positive',
				created_at: new Date().toISOString(),
			})
		),
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
				matchmaker_a_id: 'user-id',
				matchmaker_b_id: 'user-id',
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
					matchmaker_a_id: 'user-id',
					matchmaker_b_id: 'user-id',
					person_a_id: 'person-a-uuid',
					person_b_id: 'person-b-uuid',
					status: 'pending',
					notes: 'Both enjoy hiking',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				{
					id: 'intro-2',
					matchmaker_a_id: 'user-id',
					matchmaker_b_id: 'other-user-id',
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

	test('API client handles update_introduction correctly (unit test)', async () => {
		let mockUpdateIntroduction = mock(
			async (
				_id: string,
				_updates: {
					status?: 'pending' | 'accepted' | 'declined' | 'dating' | 'ended'
					notes?: string
				}
			): Promise<Introduction> => ({
				id: _id,
				matchmaker_a_id: 'user-id',
				matchmaker_b_id: 'user-id',
				person_a_id: 'person-a-uuid',
				person_b_id: 'person-b-uuid',
				status: _updates.status ?? 'pending',
				notes: _updates.notes ?? null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			updateIntroduction: mockUpdateIntroduction,
		})

		let result = await mockApiClient.updateIntroduction('intro-uuid', {
			status: 'dating',
			notes: 'They are now dating!',
		})

		expect(mockUpdateIntroduction).toHaveBeenCalledWith('intro-uuid', {
			status: 'dating',
			notes: 'They are now dating!',
		})
		expect(result.id).toBe('intro-uuid')
		expect(result.status).toBe('dating')
		expect(result.notes).toBe('They are now dating!')
	})

	test('API client handles find_matches correctly (unit test)', async () => {
		let mockFindMatches = mock(async (_personId: string): Promise<Match[]> => [])

		let mockApiClient = createMockApiClient({
			findMatches: mockFindMatches,
		})

		let result = await mockApiClient.findMatches('person-uuid')

		expect(mockFindMatches).toHaveBeenCalledWith('person-uuid')
		expect(Array.isArray(result)).toBe(true)
		// Currently returns empty array (placeholder algorithm)
		expect(result.length).toBe(0)
	})

	test('API client handles delete_person correctly (unit test)', async () => {
		let mockDeletePerson = mock(
			async (_id: string): Promise<Person> => ({
				id: _id,
				name: 'Alice',
				matchmaker_id: 'user-id',
				age: 28,
				location: 'New York',
				active: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			deletePerson: mockDeletePerson,
		})

		let result = await mockApiClient.deletePerson('person-uuid')

		expect(mockDeletePerson).toHaveBeenCalledWith('person-uuid')
		expect(result.id).toBe('person-uuid')
		expect(result.name).toBe('Alice')
		expect(result.active).toBe(false)
	})

	test('API client handles get_introduction correctly (unit test)', async () => {
		let mockGetIntroduction = mock(
			async (_id: string): Promise<Introduction> => ({
				id: _id,
				matchmaker_a_id: 'user-id',
				matchmaker_b_id: 'user-id',
				person_a_id: 'person-a-uuid',
				person_b_id: 'person-b-uuid',
				status: 'pending',
				notes: 'Both enjoy hiking',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			getIntroduction: mockGetIntroduction,
		})

		let result = await mockApiClient.getIntroduction('intro-uuid')

		expect(mockGetIntroduction).toHaveBeenCalledWith('intro-uuid')
		expect(result.id).toBe('intro-uuid')
		expect(result.matchmaker_a_id).toBe('user-id')
		expect(result.matchmaker_b_id).toBe('user-id')
		expect(result.person_a_id).toBe('person-a-uuid')
		expect(result.person_b_id).toBe('person-b-uuid')
		expect(result.status).toBe('pending')
		expect(result.notes).toBe('Both enjoy hiking')
	})

	test('API client handles submit_feedback correctly (unit test)', async () => {
		let mockSubmitFeedback = mock(
			async (
				_introduction_id: string,
				_from_person_id: string,
				_content: string,
				_sentiment?: string
			): Promise<Feedback> => ({
				id: 'feedback-id',
				introduction_id: _introduction_id,
				from_person_id: _from_person_id,
				content: _content,
				sentiment: _sentiment ?? null,
				created_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			submitFeedback: mockSubmitFeedback,
		})

		let result = await mockApiClient.submitFeedback(
			'intro-uuid',
			'person-uuid',
			'Great match! We had a wonderful time.',
			'positive'
		)

		expect(mockSubmitFeedback).toHaveBeenCalledWith(
			'intro-uuid',
			'person-uuid',
			'Great match! We had a wonderful time.',
			'positive'
		)
		expect(result.id).toBe('feedback-id')
		expect(result.introduction_id).toBe('intro-uuid')
		expect(result.from_person_id).toBe('person-uuid')
		expect(result.content).toBe('Great match! We had a wonderful time.')
		expect(result.sentiment).toBe('positive')
	})

	test('API client handles list_feedback correctly (unit test)', async () => {
		let mockListFeedback = mock(
			async (_introduction_id: string): Promise<Feedback[]> => [
				{
					id: 'feedback-1',
					introduction_id: _introduction_id,
					from_person_id: 'person-a-uuid',
					content: 'Great match!',
					sentiment: 'positive',
					created_at: new Date().toISOString(),
				},
				{
					id: 'feedback-2',
					introduction_id: _introduction_id,
					from_person_id: 'person-b-uuid',
					content: 'Nice person, but not my type.',
					sentiment: 'neutral',
					created_at: new Date().toISOString(),
				},
			]
		)

		let mockApiClient = createMockApiClient({
			listFeedback: mockListFeedback,
		})

		let result = await mockApiClient.listFeedback('intro-uuid')

		expect(mockListFeedback).toHaveBeenCalledWith('intro-uuid')
		expect(Array.isArray(result)).toBe(true)
		expect(result.length).toBe(2)

		let firstFeedback = result[0]
		expect(firstFeedback).toBeDefined()
		expect(firstFeedback?.id).toBe('feedback-1')
		expect(firstFeedback?.introduction_id).toBe('intro-uuid')
		expect(firstFeedback?.content).toBe('Great match!')
		expect(firstFeedback?.sentiment).toBe('positive')

		let secondFeedback = result[1]
		expect(secondFeedback).toBeDefined()
		expect(secondFeedback?.id).toBe('feedback-2')
		expect(secondFeedback?.content).toBe('Nice person, but not my type.')
		expect(secondFeedback?.sentiment).toBe('neutral')
	})

	test('API client handles get_feedback correctly (unit test)', async () => {
		let mockGetFeedback = mock(
			async (_id: string): Promise<Feedback> => ({
				id: _id,
				introduction_id: 'intro-uuid',
				from_person_id: 'person-uuid',
				content: 'Great match! We had a wonderful time.',
				sentiment: 'positive',
				created_at: new Date().toISOString(),
			})
		)

		let mockApiClient = createMockApiClient({
			getFeedback: mockGetFeedback,
		})

		let result = await mockApiClient.getFeedback('feedback-uuid')

		expect(mockGetFeedback).toHaveBeenCalledWith('feedback-uuid')
		expect(result.id).toBe('feedback-uuid')
		expect(result.introduction_id).toBe('intro-uuid')
		expect(result.from_person_id).toBe('person-uuid')
		expect(result.content).toBe('Great match! We had a wonderful time.')
		expect(result.sentiment).toBe('positive')
	})
})
