import { describe, test, expect } from 'bun:test'
import { configSchema } from '../src/config'

describe('configSchema', () => {
	test('parses valid config', () => {
		let result = configSchema.parse({
			SUPABASE_URL: 'https://example.supabase.co',
			SUPABASE_SERVICE_ROLE_KEY: 'test-key',
			ANTHROPIC_API_KEY: 'sk-ant-test',
			PORT: '3001',
		})

		expect(result.SUPABASE_URL).toBe('https://example.supabase.co')
		expect(result.SUPABASE_SERVICE_ROLE_KEY).toBe('test-key')
		expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-test')
		expect(result.PORT).toBe(3001)
	})

	test('defaults PORT to 3001', () => {
		let result = configSchema.parse({
			SUPABASE_URL: 'https://example.supabase.co',
			SUPABASE_SERVICE_ROLE_KEY: 'test-key',
			ANTHROPIC_API_KEY: 'sk-ant-test',
		})

		expect(result.PORT).toBe(3001)
	})

	test('rejects missing SUPABASE_URL', () => {
		expect(() =>
			configSchema.parse({
				SUPABASE_SERVICE_ROLE_KEY: 'test-key',
				ANTHROPIC_API_KEY: 'sk-ant-test',
			})
		).toThrow()
	})

	test('rejects missing SUPABASE_SERVICE_ROLE_KEY', () => {
		expect(() =>
			configSchema.parse({
				SUPABASE_URL: 'https://example.supabase.co',
				ANTHROPIC_API_KEY: 'sk-ant-test',
			})
		).toThrow()
	})

	test('rejects missing ANTHROPIC_API_KEY', () => {
		expect(() =>
			configSchema.parse({
				SUPABASE_URL: 'https://example.supabase.co',
				SUPABASE_SERVICE_ROLE_KEY: 'test-key',
			})
		).toThrow()
	})

	test('rejects invalid SUPABASE_URL', () => {
		expect(() =>
			configSchema.parse({
				SUPABASE_URL: 'not-a-url',
				SUPABASE_SERVICE_ROLE_KEY: 'test-key',
				ANTHROPIC_API_KEY: 'sk-ant-test',
			})
		).toThrow()
	})

	test('coerces PORT string to number', () => {
		let result = configSchema.parse({
			SUPABASE_URL: 'https://example.supabase.co',
			SUPABASE_SERVICE_ROLE_KEY: 'test-key',
			ANTHROPIC_API_KEY: 'sk-ant-test',
			PORT: '8080',
		})

		expect(result.PORT).toBe(8080)
	})
})
