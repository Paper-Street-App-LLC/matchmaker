import type { ChatAdapter } from '../types/adapter'

export type AdapterRegistry = Map<string, ChatAdapter>

export function createAdapterRegistry(): AdapterRegistry {
	return new Map()
}
