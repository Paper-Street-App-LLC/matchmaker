import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SignJWT } from 'jose'

export interface McpToolCaller {
	call(name: string, args: Record<string, unknown>): Promise<string>
}

type ContentBlock = { type: string; text?: string; [key: string]: unknown }

export type ToolResultPayload = {
	content?: ContentBlock[]
	isError?: boolean
}

export type SignServiceJwtOptions = {
	secret: string
	userId: string
	now?: () => number
}

let TOKEN_TTL_SECONDS = 300

export async function signServiceJwt(opts: SignServiceJwtOptions): Promise<string> {
	let nowMs = (opts.now ?? Date.now)()
	let issuedAt = Math.floor(nowMs / 1000)
	let secretBytes = new TextEncoder().encode(opts.secret)

	return await new SignJWT({ role: 'authenticated' })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(opts.userId)
		.setAudience('authenticated')
		.setIssuedAt(issuedAt)
		.setExpirationTime(issuedAt + TOKEN_TTL_SECONDS)
		.sign(secretBytes)
}

export function formatToolResult(result: ToolResultPayload): string {
	let textBlocks = (result.content ?? [])
		.filter((block): block is ContentBlock & { type: 'text'; text: string } => {
			return block.type === 'text' && typeof block.text === 'string'
		})
		.map(block => block.text)

	if (result.isError) {
		let message = textBlocks.join('\n').trim() || 'Tool execution failed'
		throw new Error(message)
	}

	return textBlocks.join('\n')
}

export type CreateMcpClientOptions = {
	baseUrl: string
	jwtSecret: string
	userId: string
	fetch?: typeof fetch
	now?: () => number
	clientName?: string
	clientVersion?: string
}

export function createMcpClient(opts: CreateMcpClientOptions): McpToolCaller {
	let connection: Promise<Client> | null = null

	let connect = async (): Promise<Client> => {
		let token = await signServiceJwt({
			secret: opts.jwtSecret,
			userId: opts.userId,
			now: opts.now,
		})

		let url = new URL(opts.baseUrl)
		let transport = new StreamableHTTPClientTransport(url, {
			fetch: opts.fetch,
			requestInit: {
				headers: { Authorization: `Bearer ${token}` },
			},
		})

		let client = new Client({
			name: opts.clientName ?? 'matchmaker-gateway',
			version: opts.clientVersion ?? '0.1.0',
		})
		await client.connect(transport)
		return client
	}

	return {
		async call(name, args) {
			connection ??= connect()
			let client = await connection
			let result = (await client.callTool({
				name,
				arguments: args,
			})) as ToolResultPayload
			return formatToolResult(result)
		},
	}
}
