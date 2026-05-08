import { describe, test, expect } from 'bun:test'
import { UpdateIntroduction } from '../../src/usecases/update-introduction'
import { InMemoryIntroductionRepository } from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makeIntroduction } from './fixtures'

describe('UpdateIntroduction use case', () => {
	test('updates status when caller is matchmakerA', async () => {
		// Arrange
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-user',
			matchmakerBId: 'mm-other',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new UpdateIntroduction({ introductionRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-1',
			status: 'accepted',
		})

		// Assert
		assertOk(result)
		expect(result.data.status).toBe('accepted')
	})

	test('updates status and notes when caller is matchmakerB', async () => {
		// Arrange
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-other',
			matchmakerBId: 'mm-user',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new UpdateIntroduction({ introductionRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-1',
			status: 'ended',
			notes: 'both moved on',
		})

		// Assert
		assertOk(result)
		expect(result.data.status).toBe('ended')
		expect(result.data.notes).toBe('both moved on')
	})

	test('updates only notes when status is omitted', async () => {
		// Arrange
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-user',
			matchmakerBId: 'mm-other',
			status: 'pending',
			notes: null,
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new UpdateIntroduction({ introductionRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-1',
			notes: 'rescheduled to next week',
		})

		// Assert
		assertOk(result)
		expect(result.data.status).toBe('pending')
		expect(result.data.notes).toBe('rescheduled to next week')
	})

	test('returns not_found when the introduction does not exist', async () => {
		// Arrange
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new UpdateIntroduction({ introductionRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-missing',
			status: 'accepted',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('not_found')
	})

	test('returns forbidden when caller is on neither side', async () => {
		// Arrange
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-a',
			matchmakerBId: 'mm-b',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new UpdateIntroduction({ introductionRepo })

		// Act
		let result = await usecase.execute({
			matchmakerId: 'mm-user',
			introductionId: 'intro-1',
			status: 'accepted',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})
})
