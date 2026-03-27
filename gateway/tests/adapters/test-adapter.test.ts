import { describe, test, expect } from 'bun:test'
import { TestAdapter } from '../../src/adapters/test/adapter'

describe('TestAdapter', () => {
	test('has provider set to "test"', () => {
		let adapter = new TestAdapter()
		expect(adapter.provider).toBe('test')
	})

	test('parseInbound creates InboundMessage from simple payload', async () => {
		let adapter = new TestAdapter()

		let msg = await adapter.parseInbound({ senderId: 'dev1', text: 'Hello' })

		expect(msg.provider).toBe('test')
		expect(msg.senderId).toBe('dev1')
		expect(msg.text).toBe('Hello')
		expect(msg.threadId).toBe('test:dev1')
		expect(typeof msg.timestamp).toBe('number')
	})

	test('parseInbound throws on missing senderId', async () => {
		let adapter = new TestAdapter()

		await expect(adapter.parseInbound({ text: 'Hello' })).rejects.toThrow()
	})

	test('parseInbound throws on missing text', async () => {
		let adapter = new TestAdapter()

		await expect(adapter.parseInbound({ senderId: 'dev1' })).rejects.toThrow()
	})

	test('verifyWebhook always returns true', async () => {
		let adapter = new TestAdapter()
		let request = new Request('http://localhost/webhook/test')

		let result = await adapter.verifyWebhook(request)

		expect(result).toBe(true)
	})

	test('sendReply stores message in replies array', async () => {
		let adapter = new TestAdapter()

		await adapter.sendReply({
			provider: 'test',
			senderId: 'dev1',
			threadId: 'test:dev1',
			text: 'Response text',
		})

		expect(adapter.replies).toHaveLength(1)
		expect(adapter.replies[0]!.text).toBe('Response text')
		expect(adapter.replies[0]!.senderId).toBe('dev1')
	})

	test('sendReply accumulates multiple replies', async () => {
		let adapter = new TestAdapter()

		await adapter.sendReply({
			provider: 'test',
			senderId: 'dev1',
			threadId: 'test:dev1',
			text: 'First',
		})
		await adapter.sendReply({
			provider: 'test',
			senderId: 'dev1',
			threadId: 'test:dev1',
			text: 'Second',
		})

		expect(adapter.replies).toHaveLength(2)
	})
})
