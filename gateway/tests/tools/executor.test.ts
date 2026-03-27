import { describe, test, expect, mock } from 'bun:test'
import { executeTool } from '../../src/tools/executor'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper to create a mock Supabase client with chainable query builder
let createMockClient = (
	fromHandler: (table: string) => unknown
): SupabaseClient => {
	return { from: mock(fromHandler) } as unknown as SupabaseClient
}

// Helper for simple insert → select → single chains
let mockInsertChain = (result: { data: unknown; error: unknown }) => ({
	insert: mock(() => ({
		select: mock(() => ({
			single: mock(async () => result),
		})),
	})),
})

// Helper for simple select chains with eq
let mockSelectEqChain = (result: { data: unknown; error: unknown }) => ({
	select: mock(() => ({
		eq: mock(() => ({
			eq: mock(() => result),
			single: mock(async () => result),
		})),
	})),
})

describe('executeTool', () => {
	test('add_person inserts and returns person data', async () => {
		let mockPerson = { id: 'person-1', name: 'Alice', matchmaker_id: 'user-1' }
		let client = createMockClient(() => mockInsertChain({ data: mockPerson, error: null }))

		let result = await executeTool(client, 'user-1', 'add_person', { name: 'Alice' })

		expect(result.isError).toBeUndefined()
		expect(JSON.parse(result.content)).toEqual(mockPerson)
		expect(client.from).toHaveBeenCalledWith('people')
	})

	test('add_person returns error when name missing', async () => {
		let client = createMockClient(() => ({}))

		let result = await executeTool(client, 'user-1', 'add_person', {})

		expect(result.isError).toBe(true)
		expect(result.content).toContain('name is required')
	})

	test('list_people returns active people for matchmaker', async () => {
		let mockPeople = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }]
		let client = createMockClient(() => ({
			select: mock(() => ({
				eq: mock(() => ({
					eq: mock(async () => ({ data: mockPeople, error: null })),
				})),
			})),
		}))

		let result = await executeTool(client, 'user-1', 'list_people', {})

		expect(result.isError).toBeUndefined()
		expect(JSON.parse(result.content)).toEqual(mockPeople)
	})

	test('get_person returns single person', async () => {
		let mockPerson = { id: 'p1', name: 'Alice' }
		let client = createMockClient(() => ({
			select: mock(() => ({
				eq: mock(() => ({
					eq: mock(() => ({
						single: mock(async () => ({ data: mockPerson, error: null })),
					})),
				})),
			})),
		}))

		let result = await executeTool(client, 'user-1', 'get_person', { id: 'p1' })

		expect(result.isError).toBeUndefined()
		expect(JSON.parse(result.content)).toEqual(mockPerson)
	})

	test('delete_person soft-deletes by setting active=false', async () => {
		let mockPerson = { id: 'p1', name: 'Alice', active: false }
		let client = createMockClient(() => ({
			update: mock(() => ({
				eq: mock(() => ({
					eq: mock(() => ({
						select: mock(() => ({
							single: mock(async () => ({ data: mockPerson, error: null })),
						})),
					})),
				})),
			})),
		}))

		let result = await executeTool(client, 'user-1', 'delete_person', { id: 'p1' })

		expect(result.isError).toBeUndefined()
		expect(JSON.parse(result.content).active).toBe(false)
	})

	test('submit_feedback inserts feedback record', async () => {
		let mockFeedback = { id: 'fb-1', content: 'Great match!' }
		let client = createMockClient(() => mockInsertChain({ data: mockFeedback, error: null }))

		let result = await executeTool(client, 'user-1', 'submit_feedback', {
			introduction_id: 'intro-1',
			from_person_id: 'p1',
			content: 'Great match!',
		})

		expect(result.isError).toBeUndefined()
		expect(JSON.parse(result.content)).toEqual(mockFeedback)
	})

	test('submit_feedback returns error when content missing', async () => {
		let client = createMockClient(() => ({}))

		let result = await executeTool(client, 'user-1', 'submit_feedback', {
			introduction_id: 'intro-1',
			from_person_id: 'p1',
		})

		expect(result.isError).toBe(true)
		expect(result.content).toContain('content is required')
	})

	test('unknown tool returns error', async () => {
		let client = createMockClient(() => ({}))

		let result = await executeTool(client, 'user-1', 'nonexistent_tool', {})

		expect(result.isError).toBe(true)
		expect(result.content).toContain('Unknown tool')
	})

	test('database error is wrapped in error result', async () => {
		let client = createMockClient(() => ({
			select: mock(() => ({
				eq: mock(() => ({
					eq: mock(async () => ({ data: null, error: { message: 'connection lost' } })),
				})),
			})),
		}))

		let result = await executeTool(client, 'user-1', 'list_people', {})

		expect(result.isError).toBe(true)
		expect(result.content).toContain('connection lost')
	})
})
