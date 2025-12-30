import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { loadConfig } from '../src/config'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('Config', () => {
	let tempDir: string
	let originalHome: string | undefined

	beforeEach(async () => {
		// Create temp directory for test configs
		tempDir = join(tmpdir(), `matchmaker-mcp-test-${Date.now()}`)
		await mkdir(join(tempDir, '.config', 'matchmaker-mcp'), { recursive: true })

		// Mock home directory
		originalHome = process.env.HOME
		process.env.HOME = tempDir
	})

	afterEach(async () => {
		// Restore original HOME
		if (originalHome) {
			process.env.HOME = originalHome
		} else {
			delete process.env.HOME
		}

		// Clean up temp directory
		await rm(tempDir, { recursive: true, force: true })
	})

	test('loadConfig() reads and parses config file', async () => {
		// Arrange: Create temp config file
		let configPath = join(tempDir, '.config', 'matchmaker-mcp', 'config.json')
		let validConfig = {
			api_base_url: 'http://localhost:3000',
			auth_token: 'test-token-123',
		}
		await writeFile(configPath, JSON.stringify(validConfig))

		// Act: Call loadConfig()
		let result = await loadConfig(configPath)

		// Assert: Returns valid config object
		expect(result).toEqual(validConfig)
		expect(result.api_base_url).toBe('http://localhost:3000')
		expect(result.auth_token).toBe('test-token-123')
	})

	test('validates required field: api_base_url', async () => {
		// Arrange: Config missing api_base_url
		let configPath = join(tempDir, '.config', 'matchmaker-mcp', 'config.json')
		let invalidConfig = {
			auth_token: 'test-token-123',
		}
		await writeFile(configPath, JSON.stringify(invalidConfig))

		// Act & Assert: Throws validation error
		await expect(loadConfig(configPath)).rejects.toThrow()
	})

	test('validates required field: auth_token', async () => {
		// Arrange: Config missing auth_token
		let configPath = join(tempDir, '.config', 'matchmaker-mcp', 'config.json')
		let invalidConfig = {
			api_base_url: 'http://localhost:3000',
		}
		await writeFile(configPath, JSON.stringify(invalidConfig))

		// Act & Assert: Throws validation error
		await expect(loadConfig(configPath)).rejects.toThrow()
	})

	test('validates api_base_url is a valid URL', async () => {
		// Arrange: Config with invalid URL
		let configPath = join(tempDir, '.config', 'matchmaker-mcp', 'config.json')
		let invalidConfig = {
			api_base_url: 'not-a-valid-url',
			auth_token: 'test-token-123',
		}
		await writeFile(configPath, JSON.stringify(invalidConfig))

		// Act & Assert: Throws validation error
		await expect(loadConfig(configPath)).rejects.toThrow()
	})

	test('validates auth_token is not empty', async () => {
		// Arrange: Config with empty auth_token
		let configPath = join(tempDir, '.config', 'matchmaker-mcp', 'config.json')
		let invalidConfig = {
			api_base_url: 'http://localhost:3000',
			auth_token: '',
		}
		await writeFile(configPath, JSON.stringify(invalidConfig))

		// Act & Assert: Throws validation error
		await expect(loadConfig(configPath)).rejects.toThrow()
	})

	test('throws error if config file missing', async () => {
		// Config file doesn't exist in temp directory
		let configPath = join(tempDir, '.config', 'matchmaker-mcp', 'missing.json')

		// Act & Assert: Clear error message
		await expect(loadConfig(configPath)).rejects.toThrow()
	})

	test('throws error if config JSON is invalid', async () => {
		// Arrange: Create config with invalid JSON
		let configPath = join(tempDir, '.config', 'matchmaker-mcp', 'config.json')
		await writeFile(configPath, '{ invalid json }')

		// Act & Assert: Parse error thrown
		await expect(loadConfig(configPath)).rejects.toThrow()
	})
})
