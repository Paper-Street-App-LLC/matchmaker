import { describe, test, expect } from 'bun:test'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

let USECASES_DIR = join(import.meta.dir, '..', '..', 'src', 'usecases')

let BANNED_IMPORT_PATTERNS: readonly RegExp[] = [
	/from ['"]hono['"]/,
	/from ['"]@hono\//,
	/from ['"]@supabase\/supabase-js['"]/,
	/from ['"]zod['"]/,
	/from ['"]\.\.\/schemas\//,
	/from ['"]\.\.\/\.\.\/schemas\//,
]

let listUseCaseFiles = (): readonly string[] =>
	readdirSync(USECASES_DIR).filter(name => name.endsWith('.ts'))

describe('use-case layer isolation', () => {
	test('no file imports hono, supabase, zod, or HTTP schemas', async () => {
		let files = listUseCaseFiles()
		expect(files.length).toBeGreaterThan(0)

		let offenses: Array<{ file: string; line: string }> = []
		for (let file of files) {
			let source = await Bun.file(join(USECASES_DIR, file)).text()
			let lines = source.split('\n')
			for (let line of lines) {
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
