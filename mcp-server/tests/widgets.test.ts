import { describe, test, expect } from 'bun:test'
import { statusBadge, sentimentBadge, personSummary } from '../src/widgets'
import type { Person } from '../src/api'

describe('statusBadge', () => {
	test('pending returns warning variant', () => {
		expect(statusBadge('pending')).toEqual({
			type: 'Badge',
			label: 'Pending',
			variant: 'warning',
		})
	})

	test('dating returns success variant', () => {
		expect(statusBadge('dating')).toEqual({
			type: 'Badge',
			label: 'Dating',
			variant: 'success',
		})
	})

	test('accepted returns success variant', () => {
		expect(statusBadge('accepted')).toEqual({
			type: 'Badge',
			label: 'Accepted',
			variant: 'success',
		})
	})

	test('declined returns destructive variant', () => {
		expect(statusBadge('declined')).toEqual({
			type: 'Badge',
			label: 'Declined',
			variant: 'destructive',
		})
	})

	test('ended returns outline variant', () => {
		expect(statusBadge('ended')).toEqual({
			type: 'Badge',
			label: 'Ended',
			variant: 'outline',
		})
	})

	test('unknown status returns secondary variant', () => {
		expect(statusBadge('custom')).toEqual({
			type: 'Badge',
			label: 'Custom',
			variant: 'secondary',
		})
	})
})

describe('sentimentBadge', () => {
	test('positive returns success variant', () => {
		expect(sentimentBadge('positive')).toEqual({
			type: 'Badge',
			label: 'Positive',
			variant: 'success',
		})
	})

	test('negative returns destructive variant', () => {
		expect(sentimentBadge('negative')).toEqual({
			type: 'Badge',
			label: 'Negative',
			variant: 'destructive',
		})
	})

	test('neutral returns secondary variant', () => {
		expect(sentimentBadge('neutral')).toEqual({
			type: 'Badge',
			label: 'Neutral',
			variant: 'secondary',
		})
	})

	test('null returns outline variant with Unknown label', () => {
		expect(sentimentBadge(null)).toEqual({
			type: 'Badge',
			label: 'Unknown',
			variant: 'outline',
		})
	})

	test('undefined returns outline variant with Unknown label', () => {
		expect(sentimentBadge(undefined)).toEqual({
			type: 'Badge',
			label: 'Unknown',
			variant: 'outline',
		})
	})
})

describe('personSummary', () => {
	test('full person returns Row with name, age, location', () => {
		let person: Person = {
			id: 'p1',
			name: 'Alice',
			matchmaker_id: 'mm1',
			age: 28,
			location: 'New York',
			gender: 'female',
			active: true,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
		}

		let result = personSummary(person)
		expect(result.type).toBe('Row')
		expect(result.children).toBeArray()

		let texts = result.children as Array<{ type: string; content: string }>
		expect(texts[0]).toEqual({ type: 'Text', content: 'Alice' })
		expect(texts.some((t: { content: string }) => t.content.includes('28'))).toBe(true)
		expect(texts.some((t: { content: string }) => t.content.includes('New York'))).toBe(true)
	})

	test('minimal person omits age and location gracefully', () => {
		let person: Person = {
			id: 'p2',
			name: 'Bob',
			matchmaker_id: 'mm1',
			active: true,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
		}

		let result = personSummary(person)
		expect(result.type).toBe('Row')

		let texts = result.children as Array<{ type: string; content: string }>
		expect(texts[0]).toEqual({ type: 'Text', content: 'Bob' })
		// Should only have the name text
		expect(texts.length).toBe(1)
	})
})
