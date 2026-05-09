export interface UserMappingDb {
	findUserId(provider: string, senderId: string): Promise<string | null>
	createUser(seed: { provider: string; senderId: string }): Promise<string>
	deleteUser(userId: string): Promise<void>
	insertMapping(provider: string, senderId: string, userId: string): Promise<void>
}

export class DuplicateMappingError extends Error {
	constructor(
		public readonly provider: string,
		public readonly senderId: string,
	) {
		super(`Mapping already exists for provider="${provider}" senderId="${senderId}"`)
		this.name = 'DuplicateMappingError'
	}
}

export interface UserMappingService {
	resolveOrCreate(provider: string, senderId: string): Promise<string>
}

export let PHONE_PROVIDERS = ['whatsapp', 'sms'] as const

export type PhoneProvider = (typeof PHONE_PROVIDERS)[number]

export function isPhoneProvider(provider: string): provider is PhoneProvider {
	return PHONE_PROVIDERS.includes(provider as PhoneProvider)
}

function phoneSiblingsOf(provider: string): string[] {
	if (!isPhoneProvider(provider)) return []
	return PHONE_PROVIDERS.filter(p => p !== provider)
}

export function createUserMappingService(options: { db: UserMappingDb }): UserMappingService {
	let { db } = options

	return {
		async resolveOrCreate(provider, senderId) {
			let existing = await db.findUserId(provider, senderId)
			if (existing) return existing

			for (let sibling of phoneSiblingsOf(provider)) {
				let viaSibling = await db.findUserId(sibling, senderId)
				if (viaSibling) {
					try {
						await db.insertMapping(provider, senderId, viaSibling)
					} catch (err) {
						if (err instanceof DuplicateMappingError) {
							let winner = await db.findUserId(provider, senderId)
							if (winner) return winner
						}
						throw err
					}
					return viaSibling
				}
			}

			let userId = await db.createUser({ provider, senderId })
			try {
				await db.insertMapping(provider, senderId, userId)
			} catch (err) {
				if (err instanceof DuplicateMappingError) {
					let winner = await db.findUserId(provider, senderId)
					if (winner) {
						try {
							await db.deleteUser(userId)
						} catch {}
						return winner
					}
				}
				throw err
			}
			return userId
		},
	}
}
