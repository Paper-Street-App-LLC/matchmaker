import { describe, test, expect } from 'bun:test'
import { z } from 'zod'
import {
	toolRegistry,
	getToolDefinition,
	type ToolName,
} from '../../src/mcp/tool-registry'

describe('MCP tool registry', () => {
	describe('catalogue', () => {
		test('lists every Matchmaker tool', () => {
			let names = toolRegistry.map(t => t.name).sort()
			expect(names).toEqual(
				[
					'add_person',
					'create_introduction',
					'delete_person',
					'find_matches',
					'get_feedback',
					'get_introduction',
					'get_person',
					'list_decisions',
					'list_feedback',
					'list_introductions',
					'list_people',
					'record_decision',
					'submit_feedback',
					'update_introduction',
					'update_person',
				].sort(),
			)
		})

		test('every entry has a unique name', () => {
			let names = toolRegistry.map(t => t.name)
			expect(new Set(names).size).toBe(names.length)
		})

		test('every entry has a non-empty description', () => {
			for (let tool of toolRegistry) {
				expect(tool.description.length).toBeGreaterThan(0)
			}
		})

		test('every entry exposes a Zod object schema', () => {
			for (let tool of toolRegistry) {
				expect(tool.inputSchema).toBeInstanceOf(z.ZodObject)
			}
		})
	})

	describe('getToolDefinition', () => {
		test('returns the matching definition by name', () => {
			let tool = getToolDefinition('add_person')
			expect(tool).toBeDefined()
			expect(tool?.name).toBe('add_person')
			expect(tool?.description).toContain('person')
		})

		test('returns undefined for unknown tool names', () => {
			expect(getToolDefinition('not_a_tool')).toBeUndefined()
		})
	})

	describe('input schemas', () => {
		test('add_person requires name', () => {
			let { inputSchema } = getToolDefinition('add_person')!
			expect(inputSchema.safeParse({}).success).toBe(false)
			expect(inputSchema.safeParse({ name: 'Alice' }).success).toBe(true)
		})

		test('list_people accepts an empty object', () => {
			let { inputSchema } = getToolDefinition('list_people')!
			expect(inputSchema.safeParse({}).success).toBe(true)
		})

		test('record_decision constrains decision to accepted or declined', () => {
			let { inputSchema } = getToolDefinition('record_decision')!
			expect(
				inputSchema.safeParse({
					person_id: '00000000-0000-0000-0000-000000000001',
					candidate_id: '00000000-0000-0000-0000-000000000002',
					decision: 'maybe',
				}).success,
			).toBe(false)
			expect(
				inputSchema.safeParse({
					person_id: '00000000-0000-0000-0000-000000000001',
					candidate_id: '00000000-0000-0000-0000-000000000002',
					decision: 'accepted',
				}).success,
			).toBe(true)
		})

		test('update_introduction constrains status enum', () => {
			let { inputSchema } = getToolDefinition('update_introduction')!
			expect(
				inputSchema.safeParse({
					id: '00000000-0000-0000-0000-000000000001',
					status: 'unknown',
				}).success,
			).toBe(false)
			for (let status of ['pending', 'accepted', 'declined', 'dating', 'ended']) {
				expect(
					inputSchema.safeParse({
						id: '00000000-0000-0000-0000-000000000001',
						status,
					}).success,
				).toBe(true)
			}
		})
	})

	describe('JSON Schema derivation', () => {
		test('every input schema converts to JSON Schema', () => {
			for (let tool of toolRegistry) {
				let json = z.toJSONSchema(tool.inputSchema)
				expect(json).toBeDefined()
				expect((json as { type?: string }).type).toBe('object')
			}
		})
	})

	describe('ToolName type', () => {
		test('every registry name is a valid ToolName', () => {
			for (let tool of toolRegistry) {
				let name: ToolName = tool.name
				expect(name).toBe(tool.name)
			}
		})
	})
})
