import type { Person, Match } from './api.js'

export type ChatKitNode = {
	type: string
	[key: string]: unknown
}

type ToolResult = {
	content: Array<{ type: 'text'; text: string }>
	isError?: boolean
	structuredContent?: ChatKitNode
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1)
}

export function statusBadge(status: string): ChatKitNode {
	let variantMap: Record<string, string> = {
		pending: 'warning',
		accepted: 'success',
		dating: 'success',
		declined: 'destructive',
		ended: 'outline',
	}
	return {
		type: 'Badge',
		label: capitalize(status),
		variant: variantMap[status] ?? 'secondary',
	}
}

export function sentimentBadge(sentiment: string | null | undefined): ChatKitNode {
	if (!sentiment) {
		return { type: 'Badge', label: 'Unknown', variant: 'outline' }
	}
	let variantMap: Record<string, string> = {
		positive: 'success',
		negative: 'destructive',
		neutral: 'secondary',
	}
	return {
		type: 'Badge',
		label: capitalize(sentiment),
		variant: variantMap[sentiment] ?? 'secondary',
	}
}

export function personSummary(person: Person): ChatKitNode {
	let children: ChatKitNode[] = [{ type: 'Text', content: person.name }]
	if (person.age != null) {
		children.push({ type: 'Text', content: `Age: ${person.age}` })
	}
	if (person.location) {
		children.push({ type: 'Text', content: person.location })
	}
	return { type: 'Row', children }
}

export function buildPersonCard(person: Person): ChatKitNode {
	let children: ChatKitNode[] = []

	// Metadata row: age, location, gender badge
	let metaItems: ChatKitNode[] = []
	if (person.age != null) {
		metaItems.push({ type: 'Text', content: `Age: ${person.age}` })
	}
	if (person.location) {
		metaItems.push({ type: 'Text', content: person.location })
	}
	if (person.gender) {
		metaItems.push({ type: 'Badge', label: capitalize(person.gender), variant: 'outline' })
	}
	if (metaItems.length > 0) {
		children.push({ type: 'Row', children: metaItems })
	}

	// Divider + personality sections
	let hasPersonality =
		person.personality?.interests?.length || person.personality?.traits?.length
	let hasPreferences = person.preferences && Object.keys(person.preferences).length > 0
	let hasNotes = person.notes

	if (metaItems.length > 0 && (hasPersonality || hasPreferences || hasNotes)) {
		children.push({ type: 'Divider' })
	}

	if (person.personality?.interests?.length) {
		children.push({ type: 'Text', content: 'Interests' })
		children.push({
			type: 'Row',
			children: person.personality.interests.map(i => ({
				type: 'Badge',
				label: i,
				variant: 'secondary',
			})),
		})
	}

	if (person.personality?.traits?.length) {
		children.push({ type: 'Text', content: 'Traits' })
		children.push({
			type: 'Row',
			children: person.personality.traits.map(t => ({
				type: 'Badge',
				label: t,
				variant: 'secondary',
			})),
		})
	}

	if (hasPreferences) {
		children.push({ type: 'Text', content: 'Preferences' })
		children.push({ type: 'Text', content: JSON.stringify(person.preferences, null, 2) })
	}

	if (hasNotes) {
		children.push({ type: 'Text', content: person.notes! })
	}

	return { type: 'Card', title: person.name, children }
}

export function buildMatchList(matches: Match[]): ChatKitNode {
	if (matches.length === 0) {
		return {
			type: 'Card',
			title: 'Match Results',
			children: [{ type: 'Text', content: 'No matches found' }],
		}
	}

	let items = matches.map(match => {
		let name = match.person?.name ?? 'Unknown'
		let parts: string[] = []
		if (match.person?.location) parts.push(match.person.location)
		if (match.match_reasons?.length) parts.push(match.match_reasons.join(', '))

		let children: ChatKitNode[] = []
		if (match.compatibility_score != null) {
			children.push({
				type: 'Badge',
				label: `${match.compatibility_score}% compatible`,
				variant: match.compatibility_score >= 80 ? 'success' : 'secondary',
			})
		}

		return {
			type: 'ListViewItem',
			title: name,
			subtitle: parts.join(' — ') || undefined,
			children: children.length > 0 ? children : undefined,
		}
	})

	return {
		type: 'Card',
		title: 'Match Results',
		children: [{ type: 'ListView', items }],
	}
}

export function widgetResult(data: unknown, widget: ChatKitNode): ToolResult {
	return {
		content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
		structuredContent: widget,
	}
}
