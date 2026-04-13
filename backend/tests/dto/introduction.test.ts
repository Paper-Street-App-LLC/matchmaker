import { describe, test, expect } from 'bun:test'
import {
	fromCreateIntroductionRequestDTO,
	fromUpdateIntroductionRequestDTO,
	toIntroductionResponseDTO,
} from '../../src/dto/introduction'
import { introductionResponseSchema } from '../../src/schemas/introductions'
import { makeIntroduction } from '../usecases/fixtures'

describe('toIntroductionResponseDTO', () => {
	test('maps a fully populated Introduction to the snake_case response shape', () => {
		// Arrange
		let intro = makeIntroduction({
			id: '650e8400-e29b-41d4-a716-446655440010',
			matchmakerAId: '550e8400-e29b-41d4-a716-446655440000',
			matchmakerBId: '550e8400-e29b-41d4-a716-446655440001',
			personAId: '650e8400-e29b-41d4-a716-446655440011',
			personBId: '650e8400-e29b-41d4-a716-446655440012',
			status: 'pending',
			notes: 'Dinner Friday',
		})

		// Act
		let dto = toIntroductionResponseDTO(intro)

		// Assert
		expect(dto).toEqual({
			id: '650e8400-e29b-41d4-a716-446655440010',
			matchmaker_a_id: '550e8400-e29b-41d4-a716-446655440000',
			matchmaker_b_id: '550e8400-e29b-41d4-a716-446655440001',
			person_a_id: '650e8400-e29b-41d4-a716-446655440011',
			person_b_id: '650e8400-e29b-41d4-a716-446655440012',
			status: 'pending',
			notes: 'Dinner Friday',
			created_at: intro.createdAt.toISOString(),
			updated_at: intro.updatedAt.toISOString(),
		})
	})

	test('preserves null notes', () => {
		// Arrange
		let intro = makeIntroduction({ notes: null })

		// Act
		let dto = toIntroductionResponseDTO(intro)

		// Assert
		expect(dto.notes).toBeNull()
	})

	test('output validates against introductionResponseSchema', () => {
		// Arrange
		let intro = makeIntroduction({
			id: '650e8400-e29b-41d4-a716-446655440010',
			matchmakerAId: '550e8400-e29b-41d4-a716-446655440000',
			matchmakerBId: '550e8400-e29b-41d4-a716-446655440001',
			personAId: '650e8400-e29b-41d4-a716-446655440011',
			personBId: '650e8400-e29b-41d4-a716-446655440012',
		})

		// Act
		let dto = toIntroductionResponseDTO(intro)

		// Assert
		expect(() => introductionResponseSchema.parse(dto)).not.toThrow()
	})
})

describe('fromCreateIntroductionRequestDTO', () => {
	test('maps a validated body + userId into CreateIntroductionInput', () => {
		// Arrange
		let body = {
			person_a_id: 'p-a',
			person_b_id: 'p-b',
			notes: 'Met at yoga',
		}

		// Act
		let input = fromCreateIntroductionRequestDTO(body, 'mm-user')

		// Assert
		expect(input).toEqual({
			userId: 'mm-user',
			personAId: 'p-a',
			personBId: 'p-b',
			notes: 'Met at yoga',
		})
	})

	test('omits notes when absent', () => {
		// Arrange
		let body = { person_a_id: 'p-a', person_b_id: 'p-b' }

		// Act
		let input = fromCreateIntroductionRequestDTO(body, 'mm-user')

		// Assert
		expect(input.notes).toBeUndefined()
	})
})

describe('fromUpdateIntroductionRequestDTO', () => {
	test('maps a validated body + ids into UpdateIntroductionStatusInput', () => {
		// Arrange
		let body = { status: 'accepted' as const, notes: 'Both excited' }

		// Act
		let input = fromUpdateIntroductionRequestDTO(body, 'mm-user', 'intro-1')

		// Assert
		expect(input).toEqual({
			userId: 'mm-user',
			introductionId: 'intro-1',
			status: 'accepted',
			notes: 'Both excited',
		})
	})

	test('omits fields that are not present', () => {
		// Arrange
		let body = { notes: 'Just a note' }

		// Act
		let input = fromUpdateIntroductionRequestDTO(body, 'mm-user', 'intro-1')

		// Assert
		expect(input.status).toBeUndefined()
		expect(input.notes).toBe('Just a note')
	})
})
