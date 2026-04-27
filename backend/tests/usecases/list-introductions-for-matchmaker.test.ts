import { describe, test, expect } from 'bun:test'
import { ListIntroductionsForMatchmaker } from '../../src/usecases/list-introductions-for-matchmaker'
import { InMemoryIntroductionRepository } from '../fakes/in-memory-repositories'
import { assertOk, makeIntroduction } from './fixtures'

describe('ListIntroductionsForMatchmaker use case', () => {
	test('returns introductions where caller is matchmakerA', async () => {
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-user',
			matchmakerBId: 'mm-other',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new ListIntroductionsForMatchmaker({ introductionRepo })

		let result = await usecase.execute({ matchmakerId: 'mm-user' })

		assertOk(result)
		expect(result.data).toHaveLength(1)
		expect(result.data[0]?.id).toBe('intro-1')
	})

	test('returns introductions where caller is matchmakerB', async () => {
		let intro = makeIntroduction({
			id: 'intro-2',
			matchmakerAId: 'mm-other',
			matchmakerBId: 'mm-user',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new ListIntroductionsForMatchmaker({ introductionRepo })

		let result = await usecase.execute({ matchmakerId: 'mm-user' })

		assertOk(result)
		expect(result.data).toHaveLength(1)
		expect(result.data[0]?.id).toBe('intro-2')
	})

	test('returns empty list when the matchmaker has no introductions', async () => {
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new ListIntroductionsForMatchmaker({ introductionRepo })

		let result = await usecase.execute({ matchmakerId: 'mm-user' })

		assertOk(result)
		expect(result.data).toHaveLength(0)
	})

	test('excludes introductions that do not involve the caller', async () => {
		let mine = makeIntroduction({
			id: 'intro-mine',
			matchmakerAId: 'mm-user',
			matchmakerBId: 'mm-other',
		})
		let theirs = makeIntroduction({
			id: 'intro-theirs',
			matchmakerAId: 'mm-a',
			matchmakerBId: 'mm-b',
		})
		let introductionRepo = new InMemoryIntroductionRepository([mine, theirs])
		let usecase = new ListIntroductionsForMatchmaker({ introductionRepo })

		let result = await usecase.execute({ matchmakerId: 'mm-user' })

		assertOk(result)
		expect(result.data).toHaveLength(1)
		expect(result.data[0]?.id).toBe('intro-mine')
	})
})
