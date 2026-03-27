import type { ChatProviderAdapter } from '../adapters/types'

let adapters = new Map<string, ChatProviderAdapter>()

export let register = (adapter: ChatProviderAdapter): void => {
	adapters.set(adapter.provider, adapter)
}

export let get = (provider: string): ChatProviderAdapter | undefined => {
	return adapters.get(provider)
}

export let clear = (): void => {
	adapters.clear()
}
