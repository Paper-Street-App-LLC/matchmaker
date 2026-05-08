import { describe, test, expect } from 'bun:test'
import {
	createUserMappingService,
	DuplicateMappingError,
	type UserMappingDb,
} from '../../src/services/user-mapping'

type MappingKey = `${string}:${string}`

function makeInMemoryDb(): { db: UserMappingDb; created: string[]; mappings: Map<MappingKey, string> } {
	let created: string[] = []
	let mappings = new Map<MappingKey, string>()
	let nextUserId = 1

	let db: UserMappingDb = {
		async findUserId(provider, senderId) {
			return mappings.get(`${provider}:${senderId}`) ?? null
		},
		async createUser() {
			let id = `user-${nextUserId++}`
			created.push(id)
			return id
		},
		async insertMapping(provider, senderId, userId) {
			mappings.set(`${provider}:${senderId}`, userId)
		},
	}

	return { db, created, mappings }
}

describe('createUserMappingService', () => {
	describe('resolveOrCreate', () => {
		test('provisions a new user and mapping when no mapping exists', async () => {
			let { db, created, mappings } = makeInMemoryDb()
			let service = createUserMappingService({ db })

			let userId = await service.resolveOrCreate('telegram', '12345')

			expect(created).toEqual([userId])
			expect(mappings.get('telegram:12345')).toBe(userId)
		})

		test('returns the existing userId without side effects when a mapping already exists', async () => {
			let { db, created, mappings } = makeInMemoryDb()
			mappings.set('telegram:12345', 'abc-123')
			let service = createUserMappingService({ db })

			let userId = await service.resolveOrCreate('telegram', '12345')

			expect(userId).toBe('abc-123')
			expect(created).toEqual([])
			expect(mappings.size).toBe(1)
		})

		test('deduplicates phone numbers across whatsapp and sms', async () => {
			let { db, created, mappings } = makeInMemoryDb()
			mappings.set('whatsapp:+15551234567', 'abc-123')
			let service = createUserMappingService({ db })

			let userId = await service.resolveOrCreate('sms', '+15551234567')

			expect(userId).toBe('abc-123')
			expect(created).toEqual([])
			expect(mappings.get('sms:+15551234567')).toBe('abc-123')
		})

		test('does not create duplicates when two first-contact calls race', async () => {
			let mappings = new Map<MappingKey, string>()
			let created: string[] = []
			let nextUserId = 1
			let releaseFirstFind: (() => void) | undefined
			let firstFindPaused = new Promise<void>(resolve => {
				releaseFirstFind = resolve
			})
			let findCount = 0

			let db: UserMappingDb = {
				async findUserId(provider, senderId) {
					findCount++
					if (findCount === 1) await firstFindPaused
					return mappings.get(`${provider}:${senderId}`) ?? null
				},
				async createUser() {
					let id = `user-${nextUserId++}`
					created.push(id)
					return id
				},
				async insertMapping(provider, senderId, userId) {
					let key: MappingKey = `${provider}:${senderId}`
					if (mappings.has(key)) {
						throw new DuplicateMappingError(provider, senderId)
					}
					mappings.set(key, userId)
				},
			}

			let service = createUserMappingService({ db })

			let firstCall = service.resolveOrCreate('telegram', '99999')
			let secondCall = service.resolveOrCreate('telegram', '99999')
			await Promise.resolve()
			await Promise.resolve()
			releaseFirstFind!()

			let [firstId, secondId] = await Promise.all([firstCall, secondCall])

			expect(firstId).toBe(secondId)
			expect(created).toHaveLength(1)
			expect(mappings.size).toBe(1)
			expect(mappings.get('telegram:99999')).toBe(firstId)
		})
	})
})
