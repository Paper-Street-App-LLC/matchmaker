import type { ChatAdapter } from '../types/adapter'

export type AdapterRegistry = Map<string, ChatAdapter>

export function createAdapterRegistry(): AdapterRegistry {
	return new Map()
}

export { createWhatsappAdapter } from './whatsapp'
export type { WhatsappAdapterOptions } from './whatsapp'
