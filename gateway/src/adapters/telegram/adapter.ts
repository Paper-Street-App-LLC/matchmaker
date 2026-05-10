import type { ChatAdapter } from '../../types/adapter'
import type { UserMappingService } from '../../services/user-mapping'

export type TelegramAdapterOptions = {
	botToken: string
	webhookSecret: string
	userMapping: UserMappingService
	fetch?: typeof fetch
}

export function createTelegramAdapter(_options: TelegramAdapterOptions): ChatAdapter {
	throw new Error('not implemented')
}
