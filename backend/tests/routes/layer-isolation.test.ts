import { describe, test, expect } from 'bun:test'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

let ROUTES_DIR = join(import.meta.dir, '..', '..', 'src', 'routes')

// Refactored HTTP-adapter routes (issue #59). Each file listed here must be
// a thin adapter: parse request -> call a use case -> map the result to a
// DTO. Direct Supabase imports are banned. To add a new route to this list
// it must first be migrated to the use-case + DTO pattern.
let REFACTORED_ROUTES: readonly string[] = [
	'people.ts',
	'introductions.ts',
	'matchDecisions.ts',
	'matches.ts',
]

// Not yet migrated. Tracked by follow-up issues.
// - feedback.ts: needs SubmitFeedback/ListFeedback use cases
// - mcp.ts: needs full MCP -> use-case migration (830 lines of duplication)
// - oauth.ts / login.ts / register.ts / well-known.ts: auth flows, not
//   business routes — out of scope for #59
let BANNED_IMPORT_PATTERNS: readonly RegExp[] = [
	/from ['"]@supabase\/supabase-js['"]/,
	/from ['"]\.\.\/lib\/supabase/,
	/from ['"]\.\.\/adapters\//,
]

describe('routes HTTP-adapter isolation', () => {
	test('refactored routes contain no direct supabase or adapter imports', async () => {
		// Guard: if a refactored file is missing, the allowlist is stale.
		let actualFiles = new Set(readdirSync(ROUTES_DIR).filter(n => n.endsWith('.ts')))
		for (let file of REFACTORED_ROUTES) {
			expect(actualFiles.has(file)).toBe(true)
		}

		let offenses: Array<{ file: string; line: string }> = []
		for (let file of REFACTORED_ROUTES) {
			let source = await Bun.file(join(ROUTES_DIR, file)).text()
			for (let line of source.split('\n')) {
				for (let pattern of BANNED_IMPORT_PATTERNS) {
					if (pattern.test(line)) {
						offenses.push({ file, line: line.trim() })
					}
				}
			}
		}

		expect(offenses).toEqual([])
	})
})
