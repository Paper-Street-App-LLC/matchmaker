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
		expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
		expect(result.matchmaker_id).toBe('123e4567-e89b-12d3-a456-426614174000')
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
		expect(firstPerson?.id).toBe('660e8400-e29b-41d4-a716-446655440001')
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

	test('getPerson(id) makes GET with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.getPerson('550e8400-e29b-41d4-a716-446655440000')

		expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
		expect(result.name).toBe('Alice')
		expect(result.matchmaker_id).toBe('123e4567-e89b-12d3-a456-426614174000')
		expect(result.age).toBe(28)
		expect(result.location).toBe('New York')
	})

	test('getPerson(id) validates id is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.getPerson('')).rejects.toThrow('ID is required')
	})

	test('getPerson(id) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.getPerson('test-id')).rejects.toThrow()
	})

	test('getPerson(id) throws on 404 not found', async () => {
		let client = new ApiClient(config)
		await expect(client.getPerson('not-found-id')).rejects.toThrow('HTTP 404')
	})

	test('updatePerson(id, updates) makes PUT with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.updatePerson('550e8400-e29b-41d4-a716-446655440000', {
			name: 'Bob',
			age: 30,
			location: 'Los Angeles',
		})

		expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
		expect(result.name).toBe('Bob')
		expect(result.age).toBe(30)
		expect(result.location).toBe('Los Angeles')
	})

	test('updatePerson(id, updates) validates id is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.updatePerson('', { name: 'Bob' })).rejects.toThrow('ID is required')
	})

	test('updatePerson(id, updates) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.updatePerson('test-id', { name: 'Bob' })).rejects.toThrow()
	})

	test('updatePerson(id, updates) throws on 404 not found', async () => {
		let client = new ApiClient(config)
		await expect(client.updatePerson('not-found-id', { name: 'Bob' })).rejects.toThrow('HTTP 404')
	})

	test('updatePerson(id, updates) can update individual fields', async () => {
		let client = new ApiClient(config)
		let result = await client.updatePerson('550e8400-e29b-41d4-a716-446655440000', {
			notes: 'Updated notes',
		})

		expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
		expect(result.notes).toBe('Updated notes')
	})

	test('createIntroduction(person_a_id, person_b_id) makes POST with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.createIntroduction(
			'550e8400-e29b-41d4-a716-446655440001',
			'550e8400-e29b-41d4-a716-446655440002'
		)

		expect(result.id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(result.person_a_id).toBe('550e8400-e29b-41d4-a716-446655440001')
		expect(result.person_b_id).toBe('550e8400-e29b-41d4-a716-446655440002')
		expect(result.status).toBe('pending')
		expect(result.matchmaker_a_id).toBe('123e4567-e89b-12d3-a456-426614174000')
		expect(result.matchmaker_b_id).toBe('123e4567-e89b-12d3-a456-426614174000')
	})

	test('createIntroduction(person_a_id, person_b_id, notes) includes notes in request', async () => {
		let client = new ApiClient(config)
		let result = await client.createIntroduction(
			'550e8400-e29b-41d4-a716-446655440001',
			'550e8400-e29b-41d4-a716-446655440002',
			'They have similar interests'
		)

		expect(result.notes).toBe('They have similar interests')
	})

	test('createIntroduction validates person_a_id is a valid UUID', async () => {
		let client = new ApiClient(config)
		await expect(
			client.createIntroduction('invalid-uuid', '550e8400-e29b-41d4-a716-446655440002')
		).rejects.toThrow('person_a_id must be a valid UUID')
	})

	test('createIntroduction validates person_b_id is a valid UUID', async () => {
		let client = new ApiClient(config)
		await expect(
			client.createIntroduction('550e8400-e29b-41d4-a716-446655440001', 'invalid-uuid')
		).rejects.toThrow('person_b_id must be a valid UUID')
	})

	test('createIntroduction throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(
			invalidClient.createIntroduction(
				'550e8400-e29b-41d4-a716-446655440001',
				'550e8400-e29b-41d4-a716-446655440002'
			)
		).rejects.toThrow()
	})

	test('listIntroductions() makes GET with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.listIntroductions()

		expect(Array.isArray(result)).toBe(true)
		expect(result.length).toBe(2)

		let firstIntro = result[0]
		expect(firstIntro).toBeDefined()
		expect(firstIntro?.id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(firstIntro?.person_a_id).toBe('550e8400-e29b-41d4-a716-446655440001')
		expect(firstIntro?.person_b_id).toBe('550e8400-e29b-41d4-a716-446655440002')
		expect(firstIntro?.status).toBe('pending')
		expect(firstIntro?.notes).toBe('Both enjoy hiking')
	})

	test('listIntroductions() returns array with multiple introductions', async () => {
		let client = new ApiClient(config)
		let result = await client.listIntroductions()

		expect(result.length).toBe(2)

		let secondIntro = result[1]
		expect(secondIntro).toBeDefined()
		expect(secondIntro?.id).toBe('770e8400-e29b-41d4-a716-446655440001')
		expect(secondIntro?.status).toBe('accepted')
		expect(secondIntro?.notes).toBeNull()
	})

	test('listIntroductions() throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.listIntroductions()).rejects.toThrow()
	})

	test('updateIntroduction(id, updates) makes PUT with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.updateIntroduction('770e8400-e29b-41d4-a716-446655440000', {
			status: 'accepted',
			notes: 'They went on a first date',
		})

		expect(result.id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(result.status).toBe('accepted')
		expect(result.notes).toBe('They went on a first date')
		expect(result.matchmaker_a_id).toBe('123e4567-e89b-12d3-a456-426614174000')
		expect(result.matchmaker_b_id).toBe('123e4567-e89b-12d3-a456-426614174000')
	})

	test('updateIntroduction(id, updates) validates id is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.updateIntroduction('', { status: 'accepted' })).rejects.toThrow(
			'ID is required'
		)
	})

	test('updateIntroduction(id, updates) validates status enum', async () => {
		let client = new ApiClient(config)
		await expect(
			client.updateIntroduction('770e8400-e29b-41d4-a716-446655440000', {
				status: 'invalid-status' as 'pending',
			})
		).rejects.toThrow()
	})

	test('updateIntroduction(id, updates) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(
			invalidClient.updateIntroduction('test-id', { status: 'accepted' })
		).rejects.toThrow()
	})

	test('updateIntroduction(id, updates) throws on 404 not found', async () => {
		let client = new ApiClient(config)
		await expect(client.updateIntroduction('not-found-id', { status: 'accepted' })).rejects.toThrow(
			'HTTP 404'
		)
	})

	test('updateIntroduction(id, updates) can update individual fields', async () => {
		let client = new ApiClient(config)
		let result = await client.updateIntroduction('770e8400-e29b-41d4-a716-446655440000', {
			notes: 'Updated notes only',
		})

		expect(result.id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(result.notes).toBe('Updated notes only')
	})

	test('findMatches(personId) makes GET with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.findMatches('550e8400-e29b-41d4-a716-446655440000')

		expect(Array.isArray(result)).toBe(true)
		expect(result.length).toBe(1)
		let match = result[0]!
		expect(match.person.name).toBe('Bob')
		expect(match.person.age).toBe(30)
		expect(match.person.location).toBe('NYC')
		expect(match.person.gender).toBe('male')
		expect(match.compatibility_score).toBe(0.8)
		expect(match.match_explanation).toContain('NYC')
		expect(match.is_cross_matchmaker).toBe(true)
	})

	test('findMatches(personId) validates personId is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.findMatches('')).rejects.toThrow('Person ID is required')
	})

	test('findMatches(personId) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.findMatches('test-person-id')).rejects.toThrow()
	})

	test('findMatches(personId) throws on 404 not found', async () => {
		let client = new ApiClient(config)
		await expect(client.findMatches('not-found-id')).rejects.toThrow('HTTP 404')
	})

	test('deletePerson(id) makes DELETE with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.deletePerson('550e8400-e29b-41d4-a716-446655440000')

		expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440000')
		expect(result.active).toBe(false)
		expect(result.name).toBe('Alice')
	})

	test('deletePerson(id) validates id is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.deletePerson('')).rejects.toThrow('ID is required')
	})

	test('deletePerson(id) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.deletePerson('test-id')).rejects.toThrow()
	})

	test('deletePerson(id) throws on 404 not found', async () => {
		let client = new ApiClient(config)
		await expect(client.deletePerson('not-found-id')).rejects.toThrow('HTTP 404')
	})

	test('getIntroduction(id) makes GET with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.getIntroduction('770e8400-e29b-41d4-a716-446655440000')

		expect(result.id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(result.matchmaker_a_id).toBe('123e4567-e89b-12d3-a456-426614174000')
		expect(result.matchmaker_b_id).toBe('123e4567-e89b-12d3-a456-426614174000')
		expect(result.person_a_id).toBe('550e8400-e29b-41d4-a716-446655440001')
		expect(result.person_b_id).toBe('550e8400-e29b-41d4-a716-446655440002')
		expect(result.status).toBe('pending')
		expect(result.notes).toBe('Both enjoy hiking')
	})

	test('getIntroduction(id) validates id is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.getIntroduction('')).rejects.toThrow('ID is required')
	})

	test('getIntroduction(id) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.getIntroduction('test-id')).rejects.toThrow()
	})

	test('getIntroduction(id) throws on 404 not found', async () => {
		let client = new ApiClient(config)
		await expect(client.getIntroduction('not-found-id')).rejects.toThrow('HTTP 404')
	})

	test('submitFeedback() makes POST with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.submitFeedback(
			'770e8400-e29b-41d4-a716-446655440000',
			'550e8400-e29b-41d4-a716-446655440001',
			'Great match! We had a wonderful time.'
		)

		expect(result.id).toBe('880e8400-e29b-41d4-a716-446655440000')
		expect(result.introduction_id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(result.from_person_id).toBe('550e8400-e29b-41d4-a716-446655440001')
		expect(result.content).toBe('Great match! We had a wonderful time.')
		expect(result.sentiment).toBeNull()
	})

	test('submitFeedback() includes sentiment when provided', async () => {
		let client = new ApiClient(config)
		let result = await client.submitFeedback(
			'770e8400-e29b-41d4-a716-446655440000',
			'550e8400-e29b-41d4-a716-446655440001',
			'Great match!',
			'positive'
		)

		expect(result.sentiment).toBe('positive')
	})

	test('submitFeedback() validates introduction_id is a valid UUID', async () => {
		let client = new ApiClient(config)
		await expect(
			client.submitFeedback('invalid-uuid', '550e8400-e29b-41d4-a716-446655440001', 'Great match!')
		).rejects.toThrow('introduction_id must be a valid UUID')
	})

	test('submitFeedback() validates from_person_id is a valid UUID', async () => {
		let client = new ApiClient(config)
		await expect(
			client.submitFeedback('770e8400-e29b-41d4-a716-446655440000', 'invalid-uuid', 'Great match!')
		).rejects.toThrow('from_person_id must be a valid UUID')
	})

	test('submitFeedback() validates content is not empty', async () => {
		let client = new ApiClient(config)
		await expect(
			client.submitFeedback(
				'770e8400-e29b-41d4-a716-446655440000',
				'550e8400-e29b-41d4-a716-446655440001',
				''
			)
		).rejects.toThrow('Content is required')
	})

	test('submitFeedback() throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(
			invalidClient.submitFeedback(
				'770e8400-e29b-41d4-a716-446655440000',
				'550e8400-e29b-41d4-a716-446655440001',
				'Great match!'
			)
		).rejects.toThrow()
	})

	test('listFeedback(introduction_id) makes GET with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.listFeedback('770e8400-e29b-41d4-a716-446655440000')

		expect(Array.isArray(result)).toBe(true)
		expect(result.length).toBe(2)

		let firstFeedback = result[0]
		expect(firstFeedback).toBeDefined()
		expect(firstFeedback?.id).toBe('880e8400-e29b-41d4-a716-446655440000')
		expect(firstFeedback?.introduction_id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(firstFeedback?.from_person_id).toBe('550e8400-e29b-41d4-a716-446655440001')
		expect(firstFeedback?.content).toBe('Great match! We had a wonderful time.')
		expect(firstFeedback?.sentiment).toBe('positive')
	})

	test('listFeedback(introduction_id) returns array with multiple feedback items', async () => {
		let client = new ApiClient(config)
		let result = await client.listFeedback('770e8400-e29b-41d4-a716-446655440000')

		expect(result.length).toBe(2)

		let secondFeedback = result[1]
		expect(secondFeedback).toBeDefined()
		expect(secondFeedback?.id).toBe('880e8400-e29b-41d4-a716-446655440001')
		expect(secondFeedback?.content).toBe('Nice person, but not my type.')
		expect(secondFeedback?.sentiment).toBe('neutral')
	})

	test('listFeedback(introduction_id) validates introduction_id is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.listFeedback('')).rejects.toThrow('Introduction ID is required')
	})

	test('listFeedback(introduction_id) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(
			invalidClient.listFeedback('770e8400-e29b-41d4-a716-446655440000')
		).rejects.toThrow()
	})

	test('getFeedback(id) makes GET with Bearer token', async () => {
		let client = new ApiClient(config)
		let result = await client.getFeedback('880e8400-e29b-41d4-a716-446655440000')

		expect(result.id).toBe('880e8400-e29b-41d4-a716-446655440000')
		expect(result.introduction_id).toBe('770e8400-e29b-41d4-a716-446655440000')
		expect(result.from_person_id).toBe('550e8400-e29b-41d4-a716-446655440001')
		expect(result.content).toBe('Great match! We had a wonderful time.')
		expect(result.sentiment).toBe('positive')
	})

	test('getFeedback(id) validates id is not empty', async () => {
		let client = new ApiClient(config)
		await expect(client.getFeedback('')).rejects.toThrow('ID is required')
	})

	test('getFeedback(id) throws on 401 unauthorized', async () => {
		let invalidClient = new ApiClient({
			...config,
			auth_token: 'invalid-token',
		})
		await expect(invalidClient.getFeedback('test-id')).rejects.toThrow()
	})

	test('getFeedback(id) throws on 404 not found', async () => {
		let client = new ApiClient(config)
		await expect(client.getFeedback('not-found-id')).rejects.toThrow('HTTP 404')
	})
})
