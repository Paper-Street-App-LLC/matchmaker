import type { Person } from './api.js'

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

export function widgetResult(data: unknown, widget: ChatKitNode): ToolResult {
	return {
		content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
		structuredContent: widget,
	}
}
