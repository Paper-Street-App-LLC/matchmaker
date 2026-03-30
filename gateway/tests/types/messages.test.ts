import { describe, test, expect } from 'bun:test'
import { InboundMessageSchema, OutboundMessageSchema } from '../../src/types/messages'

describe('InboundMessageSchema', () => {
	test('valid payload passes validation', () => {
		let valid = {
			provider: 'telegram',
			senderId: '12345',
			userId: '550e8400-e29b-41d4-a716-446655440000',
			text: 'Hello matchmaker',
			threadId: 'thread-abc',
			timestamp: 1711900000000,
		}

		let result = InboundMessageSchema.safeParse(valid)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.provider).toBe('telegram')
			expect(result.data.senderId).toBe('12345')
			expect(result.data.text).toBe('Hello matchmaker')
		}
	})

	test('missing text field fails validation', () => {
		let invalid = {
			provider: 'telegram',
			senderId: '12345',
			userId: '550e8400-e29b-41d4-a716-446655440000',
			threadId: 'thread-abc',
			timestamp: 1711900000000,
		}

		let result = InboundMessageSchema.safeParse(invalid)

		expect(result.success).toBe(false)
	})

	test('empty senderId fails validation', () => {
		let invalid = {
			provider: 'telegram',
			senderId: '',
			userId: '550e8400-e29b-41d4-a716-446655440000',
			text: 'Hello',
			threadId: 'thread-abc',
			timestamp: 1711900000000,
		}

		let result = InboundMessageSchema.safeParse(invalid)

		expect(result.success).toBe(false)
	})

	test('invalid userId (not UUID) fails validation', () => {
		let invalid = {
			provider: 'telegram',
			senderId: '12345',
			userId: 'not-a-uuid',
			text: 'Hello',
			threadId: 'thread-abc',
			timestamp: 1711900000000,
		}

		let result = InboundMessageSchema.safeParse(invalid)

		expect(result.success).toBe(false)
	})
})

describe('OutboundMessageSchema', () => {
	test('valid payload passes validation', () => {
		let valid = {
			provider: 'telegram',
			senderId: '12345',
			threadId: 'thread-abc',
			text: 'Here are your matches!',
		}

		let result = OutboundMessageSchema.safeParse(valid)

		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data.text).toBe('Here are your matches!')
		}
	})

	test('missing threadId fails validation', () => {
		let invalid = {
			provider: 'telegram',
			senderId: '12345',
			text: 'Hello',
		}

		let result = OutboundMessageSchema.safeParse(invalid)

		expect(result.success).toBe(false)
	})
})
