import { describe, test, expect } from 'bun:test'
import { UpdateIntroductionStatus } from '../../src/usecases/update-introduction-status'
import { InMemoryIntroductionRepository } from '../fakes/in-memory-repositories'
import { assertErr, assertOk, makeIntroduction } from './fixtures'

describe('UpdateIntroductionStatus use case', () => {
	test('updates status when caller is matchmakerA', async () => {
		// Arrange
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-user',
			matchmakerBId: 'mm-other',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new UpdateIntroductionStatus({ introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
			introductionId: 'intro-1',
			status: 'accepted',
		})

		// Assert
		assertOk(result)
		expect(result.data.status).toBe('accepted')
	})

	test('updates status when caller is matchmakerB', async () => {
		// Arrange
		let intro = makeIntroduction({
			id: 'intro-1',
			matchmakerAId: 'mm-other',
			matchmakerBId: 'mm-user',
		})
		let introductionRepo = new InMemoryIntroductionRepository([intro])
		let usecase = new UpdateIntroductionStatus({ introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
			introductionId: 'intro-1',
			status: 'ended',
			notes: 'both moved on',
		})

		// Assert
		assertOk(result)
		expect(result.data.status).toBe('ended')
		expect(result.data.notes).toBe('both moved on')
	})

	test('returns not_found when the introduction does not exist', async () => {
		// Arrange
		let introductionRepo = new InMemoryIntroductionRepository()
		let usecase = new UpdateIntroductionStatus({ introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
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
		let usecase = new UpdateIntroductionStatus({ introductionRepo })

		// Act
		let result = await usecase.execute({
			userId: 'mm-user',
			introductionId: 'intro-1',
			status: 'accepted',
		})

		// Assert
		assertErr(result)
		expect(result.error.code).toBe('forbidden')
	})
})
