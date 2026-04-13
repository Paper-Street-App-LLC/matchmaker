import { describe, test, expect } from 'bun:test'
import {
	fromCreateDecisionRequestDTO,
	toMatchDecisionResponseDTO,
} from '../../src/dto/match-decision'
import { decisionResponseSchema } from '../../src/schemas/matchDecisions'
import { makeDecision } from '../usecases/fixtures'

describe('toMatchDecisionResponseDTO', () => {
	test('maps an accepted decision to the snake_case response shape', () => {
		// Arrange
		let decision = makeDecision({
			id: '650e8400-e29b-41d4-a716-446655440020',
			matchmakerId: '550e8400-e29b-41d4-a716-446655440000',
			personId: '650e8400-e29b-41d4-a716-446655440021',
			candidateId: '650e8400-e29b-41d4-a716-446655440022',
			decision: 'accepted',
			declineReason: null,
		})

		// Act
		let dto = toMatchDecisionResponseDTO(decision)

		// Assert
		expect(dto).toEqual({
			id: '650e8400-e29b-41d4-a716-446655440020',
			matchmaker_id: '550e8400-e29b-41d4-a716-446655440000',
			person_id: '650e8400-e29b-41d4-a716-446655440021',
			candidate_id: '650e8400-e29b-41d4-a716-446655440022',
			decision: 'accepted',
			decline_reason: null,
			created_at: decision.createdAt.toISOString(),
		})
	})

	test('maps a declined decision with reason', () => {
		// Arrange
		let decision = makeDecision({
			decision: 'declined',
			declineReason: 'Different life stages',
		})

		// Act
		let dto = toMatchDecisionResponseDTO(decision)

		// Assert
		expect(dto.decision).toBe('declined')
		expect(dto.decline_reason).toBe('Different life stages')
	})

	test('output validates against decisionResponseSchema', () => {
		// Arrange
		let decision = makeDecision({
			id: '650e8400-e29b-41d4-a716-446655440020',
			matchmakerId: '550e8400-e29b-41d4-a716-446655440000',
			personId: '650e8400-e29b-41d4-a716-446655440021',
			candidateId: '650e8400-e29b-41d4-a716-446655440022',
		})

		// Act
		let dto = toMatchDecisionResponseDTO(decision)

		// Assert
		expect(() => decisionResponseSchema.parse(dto)).not.toThrow()
	})
})

describe('fromCreateDecisionRequestDTO', () => {
	test('maps a validated body + userId into RecordMatchDecisionInput', () => {
		// Arrange
		let body = {
			person_id: 'p-1',
			candidate_id: 'p-2',
			decision: 'accepted' as const,
		}

		// Act
		let input = fromCreateDecisionRequestDTO(body, 'mm-user')

		// Assert
		expect(input).toEqual({
			matchmakerId: 'mm-user',
			personId: 'p-1',
			candidateId: 'p-2',
			decision: 'accepted',
			declineReason: undefined,
		})
	})

	test('carries decline_reason across as declineReason', () => {
		// Arrange
		let body = {
			person_id: 'p-1',
			candidate_id: 'p-2',
			decision: 'declined' as const,
			decline_reason: 'Not compatible',
		}

		// Act
		let input = fromCreateDecisionRequestDTO(body, 'mm-user')

		// Assert
		expect(input.declineReason).toBe('Not compatible')
	})
})
