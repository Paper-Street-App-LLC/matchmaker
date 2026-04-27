import { describe, test, expect } from 'bun:test'
import { useCaseErrorToHttp } from '../../src/dto/errors'

describe('useCaseErrorToHttp', () => {
	test('maps not_found to 404 with the error message', () => {
		let result = useCaseErrorToHttp({
			code: 'not_found',
			entity: 'person',
			message: 'Person p-1 not found',
		})

		expect(result.status).toBe(404)
		expect(result.body).toEqual({ error: 'Person p-1 not found' })
	})

	test('maps forbidden to 403', () => {
		let result = useCaseErrorToHttp({
			code: 'forbidden',
			message: 'You do not own this person',
		})

		expect(result.status).toBe(403)
		expect(result.body).toEqual({ error: 'You do not own this person' })
	})

	test('maps unprocessable to 422', () => {
		let result = useCaseErrorToHttp({
			code: 'unprocessable',
			message: 'age must be at least 18',
		})

		expect(result.status).toBe(422)
		expect(result.body).toEqual({ error: 'age must be at least 18' })
	})

	test('maps conflict to 409', () => {
		let result = useCaseErrorToHttp({
			code: 'conflict',
			message: 'Decision already exists',
		})

		expect(result.status).toBe(409)
		expect(result.body).toEqual({ error: 'Decision already exists' })
	})

	test('applies a message override for the matching code', () => {
		let result = useCaseErrorToHttp(
			{ code: 'not_found', entity: 'person', message: 'Person p-1 not found' },
			{ not_found: 'Person not found' },
		)

		expect(result.status).toBe(404)
		expect(result.body).toEqual({ error: 'Person not found' })
	})

	test('ignores overrides that do not match the error code', () => {
		let result = useCaseErrorToHttp(
			{ code: 'forbidden', message: 'You do not own this person' },
			{ not_found: 'Person not found' },
		)

		expect(result.status).toBe(403)
		expect(result.body).toEqual({ error: 'You do not own this person' })
	})

	test('supports overrides for multiple codes at once', () => {
		let overrides = {
			not_found: 'Introduction not found',
			forbidden: 'Access denied',
		}
		let notFound = useCaseErrorToHttp(
			{ code: 'not_found', entity: 'introduction', message: 'Introduction intro-1 not found' },
			overrides,
		)
		let forbidden = useCaseErrorToHttp(
			{ code: 'forbidden', message: 'You do not own this introduction' },
			overrides,
		)

		expect(notFound.body).toEqual({ error: 'Introduction not found' })
		expect(forbidden.body).toEqual({ error: 'Access denied' })
	})
})
