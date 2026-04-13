import { describe, test, expect } from 'bun:test'
import {
	fromCreatePersonRequestDTO,
	fromUpdatePersonRequestDTO,
	toPersonResponseDTO,
} from '../../src/dto/person'
import { personResponseSchema } from '../../src/schemas/people'
import { makePerson } from '../usecases/fixtures'

describe('toPersonResponseDTO', () => {
	test('maps a fully populated Person to the snake_case response shape', () => {
		// Arrange
		let person = makePerson({
			id: '650e8400-e29b-41d4-a716-446655440001',
			matchmakerId: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Alex Rivera',
			age: 31,
			location: 'Oakland',
			gender: 'nonbinary',
			notes: 'Met at co-op',
		})

		// Act
		let dto = toPersonResponseDTO(person)

		// Assert
		expect(dto).toEqual({
			id: '650e8400-e29b-41d4-a716-446655440001',
			matchmaker_id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'Alex Rivera',
			age: 31,
			location: 'Oakland',
			gender: 'nonbinary',
			preferences: null,
			personality: null,
			notes: 'Met at co-op',
			active: true,
			created_at: person.createdAt.toISOString(),
			updated_at: person.updatedAt.toISOString(),
		})
	})

	test('preserves null optional fields', () => {
		// Arrange
		let person = makePerson({
			id: '650e8400-e29b-41d4-a716-446655440002',
			age: null,
			location: null,
			gender: null,
			notes: null,
		})

		// Act
		let dto = toPersonResponseDTO(person)

		// Assert
		expect(dto.age).toBeNull()
		expect(dto.location).toBeNull()
		expect(dto.gender).toBeNull()
		expect(dto.notes).toBeNull()
	})

	test('output validates against personResponseSchema', () => {
		// Arrange
		let person = makePerson({
			id: '650e8400-e29b-41d4-a716-446655440003',
			matchmakerId: '550e8400-e29b-41d4-a716-446655440000',
		})

		// Act
		let dto = toPersonResponseDTO(person)

		// Assert — guarantees HTTP API backwards compatibility
		expect(() => personResponseSchema.parse(dto)).not.toThrow()
	})
})

describe('fromCreatePersonRequestDTO', () => {
	test('maps a validated body + matchmakerId into CreatePersonInput', () => {
		// Arrange
		let body = {
			name: 'Alex',
			age: 30,
			location: 'Oakland',
			notes: 'Friend of a friend',
		}

		// Act
		let input = fromCreatePersonRequestDTO(body, 'mm-user-1')

		// Assert
		expect(input).toEqual({
			matchmakerId: 'mm-user-1',
			name: 'Alex',
			age: 30,
			location: 'Oakland',
			gender: undefined,
			preferences: undefined,
			personality: undefined,
			notes: 'Friend of a friend',
		})
	})

	test('handles body with only required fields', () => {
		// Arrange
		let body = { name: 'Alex' }

		// Act
		let input = fromCreatePersonRequestDTO(body, 'mm-user-1')

		// Assert
		expect(input.matchmakerId).toBe('mm-user-1')
		expect(input.name).toBe('Alex')
		expect(input.age).toBeUndefined()
	})
})

describe('fromUpdatePersonRequestDTO', () => {
	test('maps a validated body + ids into UpdatePersonInput', () => {
		// Arrange
		let body = { name: 'New Name', location: 'Portland' }

		// Act
		let input = fromUpdatePersonRequestDTO(body, 'mm-user-1', 'p-1')

		// Assert
		expect(input).toEqual({
			matchmakerId: 'mm-user-1',
			personId: 'p-1',
			patch: {
				name: 'New Name',
				location: 'Portland',
			},
		})
	})

	test('includes only fields present in the body', () => {
		// Arrange
		let body = { notes: 'Updated notes' }

		// Act
		let input = fromUpdatePersonRequestDTO(body, 'mm-user-1', 'p-1')

		// Assert
		expect(input.patch).toEqual({ notes: 'Updated notes' })
	})
})
