import { z } from 'zod'
import { readFile } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'

let configSchema = z.object({
	api_base_url: z.string().url(),
	auth_token: z.string().min(1),
})

export type Config = z.infer<typeof configSchema>

export async function loadConfig(customPath?: string): Promise<Config> {
	let configPath =
		customPath || join(homedir(), '.config', 'matchmaker-mcp', 'config.json')
	let content = await readFile(configPath, 'utf-8')
	let parsed = JSON.parse(content)
	return configSchema.parse(parsed)
}
