import { describe, test, expect } from 'bun:test'
import type {
	IIntroductionRepository,
	IntroductionUpdate,
} from '../../src/repositories/introduction-repository'
import { createIntroduction, type Introduction } from '../../src/domain/introduction'

function buildIntroduction(): Introduction {
	return createIntroduction({
		id: 'intro-1',
		matchmakerAId: 'mm-a',
		matchmakerBId: 'mm-b',
		personAId: 'person-a',
		personBId: 'person-b',
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-01T00:00:00Z'),
	})
}

function makeStub(): IIntroductionRepository {
	let store: Introduction[] = []
	return {
		async findById(id) {
			return store.find((i) => i.id === id) ?? null
		},
		async findByMatchmaker(matchmakerId) {
			return store.filter(
				(i) => i.matchmakerAId === matchmakerId || i.matchmakerBId === matchmakerId,
			)
		},
		async create(introduction) {
			store.push(introduction)
			return introduction
		},
		async update(_id, _patch) {
			return store[0]!
		},
	}
}

describe('IIntroductionRepository (contract)', () => {
	test('a stub conforming to the interface compiles and runs', async () => {
		let repo = makeStub()
		let intro = buildIntroduction()

		let created = await repo.create(intro)
		expect(created.id).toBe('intro-1')

		let found = await repo.findById('intro-1')
		expect(found?.id).toBe('intro-1')

		let listA = await repo.findByMatchmaker('mm-a')
		expect(listA.length).toBe(1)

		let listB = await repo.findByMatchmaker('mm-b')
		expect(listB.length).toBe(1)

		let listOther = await repo.findByMatchmaker('mm-other')
		expect(listOther.length).toBe(0)
	})

	test('IntroductionUpdate accepts only status and notes', () => {
		let patch: IntroductionUpdate = { status: 'accepted', notes: 'going well' }
		expect(patch.status).toBe('accepted')

		// @ts-expect-error — id must not appear in IntroductionUpdate
		let badId: IntroductionUpdate = { id: 'x' }
		expect(badId).toBeDefined()

		// @ts-expect-error — matchmakerAId must not appear in IntroductionUpdate
		let badMatchmaker: IntroductionUpdate = { matchmakerAId: 'mm-x' }
		expect(badMatchmaker).toBeDefined()
	})

	test('update returns Promise<Introduction>', async () => {
		let repo = makeStub()
		await repo.create(buildIntroduction())
		let updated: Introduction = await repo.update('intro-1', { status: 'accepted' })
		expect(updated).toBeDefined()
	})
})
