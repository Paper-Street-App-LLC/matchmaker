/**
 * Guards against drift between the Zod row schema in the user mapping
 * store and the actual column list in the SQL migration. Mirrors the
 * conversations schema-drift test.
 */
import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dbRowSchema } from '../../src/store/user-provider-mappings'

function extractColumnNames(sql: string): string[] {
	let match = sql.match(
		/CREATE TABLE\s+(?:public\.)?user_provider_mappings\s*\(([^;]+)\)\s*;/i,
	)
	if (!match) throw new Error('could not find CREATE TABLE user_provider_mappings in migration')

	let body = match[1] ?? ''
	let columns: string[] = []
	for (let rawLine of body.split('\n')) {
		let line = rawLine.trim()
		if (line === '' || line.startsWith('--')) continue

		let firstToken = line.split(/\s+/)[0] ?? ''
		let name = firstToken.replace(/,$/, '')
		let upper = name.toUpperCase()
		if (
			name === '' ||
			upper === 'CHECK' ||
			upper === 'CONSTRAINT' ||
			upper === 'PRIMARY' ||
			upper === 'UNIQUE' ||
			upper === 'FOREIGN'
		) {
			continue
		}
		columns.push(name)
	}
	return columns
}

describe('user_provider_mappings schema drift', () => {
	test('Zod dbRowSchema keys match the migration column list exactly', () => {
		let migrationPath = join(
			import.meta.dir,
			'../../../supabase/migrations/20260507000000_add_user_provider_mappings.sql',
		)
		let sql = readFileSync(migrationPath, 'utf8')

		let migrationColumns = new Set(extractColumnNames(sql))
		let schemaKeys = new Set(Object.keys(dbRowSchema.shape))

		expect(schemaKeys).toEqual(migrationColumns)
	})
})
