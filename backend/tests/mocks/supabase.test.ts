import { describe, expect, test } from 'bun:test'
import { createMockSupabaseClient, VALID_TABLES } from './supabase'

describe('createMockSupabaseClient', () => {
	describe('valid tables', () => {
		test('from("people") returns a query builder', () => {
			let client = createMockSupabaseClient()
			let builder = client.from('people')
			expect(builder.select).toBeDefined()
			expect(builder.insert).toBeDefined()
			expect(builder.update).toBeDefined()
			expect(builder.delete).toBeDefined()
		})

		test('from("introductions") returns a query builder', () => {
			let client = createMockSupabaseClient()
			let builder = client.from('introductions')
			expect(builder.select).toBeDefined()
			expect(builder.insert).toBeDefined()
		})

		test('from("feedback") returns a query builder', () => {
			let client = createMockSupabaseClient()
			let builder = client.from('feedback')
			expect(builder.select).toBeDefined()
			expect(builder.insert).toBeDefined()
		})
	})

	describe('unknown tables', () => {
		test('from("nonexistent") throws with a descriptive error', () => {
			let client = createMockSupabaseClient()
			expect(() => client.from('nonexistent')).toThrow(
				'Mock Supabase: unknown table "nonexistent"'
			)
		})
	})

	describe('backward compatibility', () => {
		test('createMockSupabaseClient() with no args still works', () => {
			let client = createMockSupabaseClient()
			expect(client.auth).toBeDefined()
			expect(client.from).toBeDefined()
		})
	})

	describe('from override', () => {
		test('when from override is provided, VALID_TABLES guard is bypassed', () => {
			let customFrom = (_table: string) => ({ custom: true })
			let client = createMockSupabaseClient({ from: customFrom })
			// Should not throw even for unknown tables
			expect(() => client.from('anything')).not.toThrow()
			expect((client.from('anything') as any).custom).toBe(true)
		})
	})

	describe('VALID_TABLES export', () => {
		test('contains expected tables', () => {
			expect(VALID_TABLES.has('people')).toBe(true)
			expect(VALID_TABLES.has('introductions')).toBe(true)
			expect(VALID_TABLES.has('feedback')).toBe(true)
		})
	})
})
