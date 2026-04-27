/**
 * Soft-parity contract: the stdio transport must advertise every tool in the
 * shared registry, modulo an explicit opt-out set (currently empty). This
 * exists to catch drift if anyone replaces buildMcpToolList() with hand-rolled
 * tool definitions at the stdio call site — the same drift that previously
 * caused record_decision and list_decisions to be missing from stdio.
 *
 * Tests the actual call site: listAdvertisedTools() is what the stdio
 * ListToolsRequestSchema handler returns to clients.
 */
import { describe, test, expect } from 'bun:test'
import { toolRegistry, type ToolName } from '@matchmaker/shared'
import { listAdvertisedTools } from '../src/index'

let tools = listAdvertisedTools()
let stdioOptOuts: ReadonlySet<ToolName> = new Set()

describe('stdio MCP transport parity with shared tool registry', () => {
	test('advertises every registry tool except its opt-outs', () => {
		let expected = toolRegistry
			.map(t => t.name)
			.filter(name => !stdioOptOuts.has(name))
			.sort()
		let advertised = tools.map(t => t.name).sort()
		expect(advertised).toEqual(expected)
	})

	test('does not advertise tools missing from the registry', () => {
		let registryNames = new Set<string>(toolRegistry.map(t => t.name))
		for (let tool of tools) {
			expect(registryNames.has(tool.name)).toBe(true)
		}
	})

	test('preserves the registry description for each advertised tool', () => {
		let byName = new Map(toolRegistry.map(t => [t.name, t.description]))
		for (let tool of tools) {
			expect(tool.description).toBe(byName.get(tool.name)!)
		}
	})

	test('every advertised inputSchema is a JSON-Schema object', () => {
		for (let tool of tools) {
			expect((tool.inputSchema as { type?: string }).type).toBe('object')
		}
	})
})
