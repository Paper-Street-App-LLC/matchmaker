import { describe, test, expect, mock } from 'bun:test'
import { toolRegistry } from '@matchmaker/shared'
import type { McpToolCaller } from '../../src/core/mcp-client'
import { createMatchmakerTools } from '../../src/core/tools'

function createCallerMock(impl?: McpToolCaller['call']): {
	caller: McpToolCaller
	call: ReturnType<typeof mock>
} {
	let call = mock(impl ?? (async () => 'ok'))
	return { caller: { call }, call }
}

describe('createMatchmakerTools', () => {
	test('exposes one tool per shared registry entry', () => {
		let { caller } = createCallerMock()
		let tools = createMatchmakerTools(caller)

		for (let def of toolRegistry) {
			expect(tools[def.name]).toBeDefined()
		}
		expect(Object.keys(tools)).toHaveLength(toolRegistry.length)
	})

	test('preserves descriptions from the shared registry', () => {
		let { caller } = createCallerMock()
		let tools = createMatchmakerTools(caller)

		for (let def of toolRegistry) {
			let tool = tools[def.name]!
			expect(tool.description).toBe(def.description)
		}
	})

	test('uses the shared Zod schema as inputSchema', () => {
		let { caller } = createCallerMock()
		let tools = createMatchmakerTools(caller)

		let listPeople = tools['list_people']!
		expect(listPeople.inputSchema).toBe(toolRegistry.find(t => t.name === 'list_people')!.inputSchema)
	})

	test('execute() forwards tool name and args to the caller', async () => {
		let { caller, call } = createCallerMock(async () => 'ok')
		let tools = createMatchmakerTools(caller)

		let addPerson = tools['add_person']!
		let result = await addPerson.execute!({ name: 'Alex' }, {} as never)

		expect(call).toHaveBeenCalledTimes(1)
		expect(call.mock.calls[0]).toEqual(['add_person', { name: 'Alex' }])
		expect(result).toBe('ok')
	})

	test('execute() returns the caller response verbatim for downstream display', async () => {
		let { caller } = createCallerMock(async () => '[{"id":"p1","name":"Alex"}]')
		let tools = createMatchmakerTools(caller)

		let listPeople = tools['list_people']!
		let result = await listPeople.execute!({}, {} as never)

		expect(result).toBe('[{"id":"p1","name":"Alex"}]')
	})

	test('execute() surfaces caller errors so the AI SDK can record tool failures', async () => {
		let { caller } = createCallerMock(async () => {
			throw new Error('permission denied')
		})
		let tools = createMatchmakerTools(caller)

		let getPerson = tools['get_person']!
		await expect(getPerson.execute!({ id: 'p1' }, {} as never)).rejects.toThrow('permission denied')
	})
})
