import { describe, test, expect } from 'bun:test'
import { GetIntroductionById } from '../../src/usecases/get-introduction-by-id'
import { InMemoryIntroductionRepository } from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makeIntroduction } from './fixtures'

describe('GetIntroductionById use case', () => {
	test('returns the introduction when caller is matchmakerA', async () => {
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-user',
			matchmakerBId: 'mm-other',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new GetIntroductionById({ introductionRepo })

		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-1',
		})

		assertOk(result)
		expect(result.data.id).toBe('intro-1')
	})

	test('returns the introduction when caller is matchmakerB', async () => {
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-other',
			matchmakerBId: 'mm-user',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new GetIntroductionById({ introductionRepo })

		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-1',
		})

		assertOk(result)
		expect(result.data.id).toBe('intro-1')
	})

	test('returns not_found when the introduction does not exist', async () => {
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new GetIntroductionById({ introductionRepo })

		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-missing',
		})

		assertErr(result)
		expect(result.error.code).toBe('not_found')
		if (result.error.code === 'not_found') {
			expect(result.error.entity).toBe('introduction')
		}
	})

	test('returns forbidden when the caller is neither matchmakerA nor matchmakerB', async () => {
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-a',
			matchmakerBId: 'mm-b',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new GetIntroductionById({ introductionRepo })

		let result = await usecase.execute({
			matchmakerId: 'mm-outsider',
			introductionId: 'intro-1',
		})

		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})
})
