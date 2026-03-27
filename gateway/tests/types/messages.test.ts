import { describe, test, expect } from 'bun:test'
import { inboundMessageSchema, outboundMessageSchema } from '../../src/types/messages'

describe('InboundMessage schema', () => {
	test('validates a complete inbound message', () => {
		let result = inboundMessageSchema.parse({
			provider: 'telegram',
			senderId: '12345',
			text: 'Hello',
			threadId: 'telegram:12345',
			timestamp: Date.now(),
		})

		expect(result.provider).toBe('telegram')
		expect(result.senderId).toBe('12345')
		expect(result.text).toBe('Hello')
		expect(result.threadId).toBe('telegram:12345')
		expect(typeof result.timestamp).toBe('number')
	})

	test('rejects missing text field', () => {
		expect(() =>
			inboundMessageSchema.parse({
				provider: 'telegram',
				senderId: '12345',
				threadId: 'telegram:12345',
				timestamp: Date.now(),
			})
		).toThrow()
	})

	test('rejects missing provider', () => {
		expect(() =>
			inboundMessageSchema.parse({
				senderId: '12345',
				text: 'Hello',
				threadId: 'telegram:12345',
				timestamp: Date.now(),
			})
		).toThrow()
	})

	test('rejects missing senderId', () => {
		expect(() =>
			inboundMessageSchema.parse({
				provider: 'telegram',
				text: 'Hello',
				threadId: 'telegram:12345',
				timestamp: Date.now(),
			})
		).toThrow()
	})

	test('rejects missing threadId', () => {
		expect(() =>
			inboundMessageSchema.parse({
				provider: 'telegram',
				senderId: '12345',
				text: 'Hello',
				timestamp: Date.now(),
			})
		).toThrow()
	})

	test('rejects missing timestamp', () => {
		expect(() =>
			inboundMessageSchema.parse({
				provider: 'telegram',
				senderId: '12345',
				text: 'Hello',
				threadId: 'telegram:12345',
			})
		).toThrow()
	})
})

describe('OutboundMessage schema', () => {
	test('validates a complete outbound message', () => {
		let result = outboundMessageSchema.parse({
			provider: 'telegram',
			senderId: '12345',
			threadId: 'telegram:12345',
			text: 'Hi there!',
		})

		expect(result.provider).toBe('telegram')
		expect(result.text).toBe('Hi there!')
	})

	test('rejects missing text', () => {
		expect(() =>
			outboundMessageSchema.parse({
				provider: 'telegram',
				senderId: '12345',
				threadId: 'telegram:12345',
			})
		).toThrow()
	})

	test('rejects missing provider', () => {
		expect(() =>
			outboundMessageSchema.parse({
				senderId: '12345',
				threadId: 'telegram:12345',
				text: 'Hi',
			})
		).toThrow()
	})
})
