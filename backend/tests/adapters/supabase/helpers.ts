import type { SupabaseClient } from '@supabase/supabase-js'

export type FakeCall = { method: string; args: readonly unknown[] }

export type FakeScript = { data: unknown; error: unknown }

/**
 * Builds a chainable stand-in for the supabase-js query builder. Every
 * intermediate method records its call and returns the chain. Terminal
 * methods (`single`, `maybeSingle`) and awaiting the chain directly both
 * resolve to the scripted `{data, error}` response.
 */
export let createFakeSupabase = (script: FakeScript = { data: null, error: null }) => {
	let calls: FakeCall[] = []

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let chain: any = {
		then(onFulfilled: (value: FakeScript) => unknown, onRejected?: (reason: unknown) => unknown) {
			return Promise.resolve(script).then(onFulfilled, onRejected)
		},
	}

	for (let m of ['select', 'eq', 'or', 'insert', 'update', 'delete', 'order', 'limit']) {
		chain[m] = (...args: unknown[]) => {
			calls.push({ method: m, args })
			return chain
		}
	}
	chain.single = (...args: unknown[]) => {
		calls.push({ method: 'single', args })
		return Promise.resolve(script)
	}
	chain.maybeSingle = (...args: unknown[]) => {
		calls.push({ method: 'maybeSingle', args })
		return Promise.resolve(script)
	}

	let client = {
		from: (table: string) => {
			calls.push({ method: 'from', args: [table] })
			return chain
		},
	}

	return { client: client as unknown as SupabaseClient, calls }
}
