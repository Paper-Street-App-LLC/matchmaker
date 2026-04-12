import { describe, test, expect } from 'bun:test'
import { createAdapterRegistry } from '../../src/adapters/index'

describe('adapter registry', () => {
	test('createAdapterRegistry returns an empty Map', () => {
		let registry = createAdapterRegistry()
		expect(registry).toBeInstanceOf(Map)
		expect(registry.size).toBe(0)
	})
})
