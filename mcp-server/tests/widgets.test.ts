import { describe, test, expect } from 'bun:test'
import {
	statusBadge,
	sentimentBadge,
	personSummary,
	buildPersonCard,
	buildMatchList,
} from '../src/widgets'
import type { Person, Match } from '../src/api'

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

describe('buildPersonCard', () => {
	test('full person returns Card with all sections', () => {
		let person: Person = {
			id: 'p1',
			name: 'Alice',
			matchmaker_id: 'mm1',
			age: 28,
			location: 'New York',
			gender: 'female',
			personality: {
				interests: ['hiking', 'cooking'],
				traits: ['outgoing', 'kind'],
			},
			preferences: {
				ageRange: { min: 25, max: 35 },
				locations: ['New York', 'Boston'],
			},
			notes: 'Looking for a serious relationship',
			active: true,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
		}

		let card = buildPersonCard(person)
		expect(card.type).toBe('Card')
		expect(card.title).toBe('Alice')

		let children = card.children as Array<{ type: string; [key: string]: unknown }>
		expect(children.length).toBeGreaterThan(0)

		// Should have metadata row with age, location, gender
		let metaRow = children[0]
		expect(metaRow?.type).toBe('Row')
		let metaChildren = metaRow?.children as Array<{ type: string; content?: string }>
		expect(metaChildren.some(c => c.content?.includes('28'))).toBe(true)
		expect(metaChildren.some(c => c.content?.includes('New York'))).toBe(true)
		expect(metaChildren.some(c => c.type === 'Badge')).toBe(true)

		// Should have divider
		expect(children.some(c => c.type === 'Divider')).toBe(true)

		// Should have interests section with badges
		let interestsSection = children.find(
			c => c.type === 'Row' && Array.isArray(c.children) &&
				(c.children as Array<{ label?: string }>).some(b => b.label === 'hiking')
		)
		expect(interestsSection).toBeDefined()

		// Should have traits section with badges
		let traitsSection = children.find(
			c => c.type === 'Row' && Array.isArray(c.children) &&
				(c.children as Array<{ label?: string }>).some(b => b.label === 'outgoing')
		)
		expect(traitsSection).toBeDefined()

		// Should have notes
		let notesText = children.find(
			c => c.type === 'Text' && (c.content as string)?.includes('serious relationship')
		)
		expect(notesText).toBeDefined()
	})

	test('minimal person returns Card with title only, no empty sections', () => {
		let person: Person = {
			id: 'p2',
			name: 'Bob',
			matchmaker_id: 'mm1',
			active: true,
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
		}

		let card = buildPersonCard(person)
		expect(card.type).toBe('Card')
		expect(card.title).toBe('Bob')

		let children = card.children as Array<{ type: string }>
		// Should not have any sections since there's no metadata
		expect(children.length).toBe(0)
	})
})

describe('buildMatchList', () => {
	test('empty matches returns Card with no-matches message', () => {
		let card = buildMatchList([])
		expect(card.type).toBe('Card')
		expect(card.title).toBe('Match Results')

		let children = card.children as Array<{ type: string; content?: string }>
		expect(children[0]?.type).toBe('Text')
		expect(children[0]?.content).toBe('No matches found')
	})

	test('matches returns Card with ListView', () => {
		let matches: Match[] = [
			{
				person: { id: 'p1', name: 'Alice', age: 28, location: 'New York' },
				compatibility_score: 85,
				match_reasons: ['Similar interests', 'Same city'],
			},
			{
				person: { id: 'p2', name: 'Carol', age: 31, location: 'Boston' },
				compatibility_score: 72,
				match_reasons: ['Compatible personality'],
			},
		]

		let card = buildMatchList(matches)
		expect(card.type).toBe('Card')
		expect(card.title).toBe('Match Results')

		let children = card.children as Array<{ type: string; items?: unknown[] }>
		let listView = children.find(c => c.type === 'ListView')
		expect(listView).toBeDefined()

		let items = listView?.items as Array<{
			type: string
			title?: string
			subtitle?: string
			children?: Array<{ type: string; label?: string }>
		}>
		expect(items.length).toBe(2)
		expect(items[0]?.title).toBe('Alice')
		expect(items[0]?.subtitle).toContain('New York')
		// Should have score badge
		let scoreBadge = items[0]?.children?.find(c => c.type === 'Badge')
		expect(scoreBadge).toBeDefined()
		expect(scoreBadge?.label).toContain('85')
	})

	test('match with missing person is handled gracefully', () => {
		let matches: Match[] = [
			{
				compatibility_score: 60,
				match_reasons: ['Algorithm suggestion'],
			},
		]

		let card = buildMatchList(matches)
		let children = card.children as Array<{ type: string; items?: unknown[] }>
		let listView = children.find(c => c.type === 'ListView')
		expect(listView).toBeDefined()

		let items = listView?.items as Array<{ title?: string }>
		expect(items[0]?.title).toBe('Unknown')
	})
})
