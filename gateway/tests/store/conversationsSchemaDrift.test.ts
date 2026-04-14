/**
 * Guards against drift between the Zod row schema in the conversation
 * store and the actual column list in the SQL migration. Without this,
 * someone can add a column to the migration without updating the
 * parser (or vice versa), and the mock-backed store tests will stay
 * green while real Supabase rows fail to parse at runtime.
 *
 * The check is structural: parse column names out of the CREATE TABLE
 * statement and compare against the Zod schema's top-level keys.
 */
import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dbRowSchema } from '../../src/store/conversations'

function extractColumnNames(sql: string): string[] {
	let match = sql.match(/CREATE TABLE\s+conversations\s*\(([^;]+)\)\s*;/i)
	if (!match) throw new Error('could not find CREATE TABLE conversations in migration')

	let body = match[1] ?? ''
	let columns: string[] = []
	for (let rawLine of body.split('\n')) {
		let line = rawLine.trim()
		if (line === '' || line.startsWith('--')) continue

		let firstToken = line.split(/\s+/)[0] ?? ''
		let name = firstToken.replace(/,$/, '')
		if (name === '' || name.toUpperCase() === 'CHECK' || name.toUpperCase() === 'CONSTRAINT') {
			continue
		}
		columns.push(name)
	}
	return columns
}

describe('conversations schema drift', () => {
	test('Zod dbRowSchema keys match the migration column list exactly', () => {
		let migrationPath = join(
			import.meta.dir,
			'../../../supabase/migrations/20260329000000_add_conversations.sql',
		)
		let sql = readFileSync(migrationPath, 'utf8')

		let migrationColumns = new Set(extractColumnNames(sql))
		let schemaKeys = new Set(Object.keys(dbRowSchema.shape))

		expect(schemaKeys).toEqual(migrationColumns)
	})
})
