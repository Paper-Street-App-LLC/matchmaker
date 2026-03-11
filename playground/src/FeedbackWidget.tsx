import { useRef, useState } from 'react'
import { useApp, useHostStyles, useDocumentTheme } from '@modelcontextprotocol/ext-apps/react'
import { useToolResultBuffer } from './useToolResult'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import '@openai/apps-sdk-ui/css'

interface Person { id: string; name: string; age?: number | null; location?: string | null }

interface FeedbackEntry {
	id: string
	introduction_id: string
	from_person_id: string
	from_person?: Person | null
	content: string
	sentiment?: string | null
	created_at: string
}

const SENTIMENT_CONFIG = {
	positive: { icon: '😊', label: 'Positive', bg: '#dcfce7', text: '#15803d', darkBg: 'rgba(34,197,94,0.18)', darkText: '#86efac' },
	neutral:  { icon: '😐', label: 'Neutral',  bg: '#fef9c3', text: '#a16207', darkBg: 'rgba(234,179,8,0.18)',  darkText: '#fde047' },
	negative: { icon: '😔', label: 'Negative', bg: '#fee2e2', text: '#b91c1c', darkBg: 'rgba(239,68,68,0.18)',  darkText: '#fca5a5' },
}

function formatDate(iso: string) {
	if (!iso) return ''
	return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function FeedbackCard({ entry, isDark }: { entry: FeedbackEntry; isDark: boolean }) {
	const sentiment = entry.sentiment ? SENTIMENT_CONFIG[entry.sentiment as keyof typeof SENTIMENT_CONFIG] : null
	const initial = entry.from_person?.name?.charAt(0).toUpperCase() ?? '?'

	return (
		<div style={{
			display: 'flex', gap: 12, padding: '14px 0',
			borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6'}`,
		}}>
			{/* Avatar */}
			<div style={{
				width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
				background: isDark ? 'rgba(255,255,255,0.12)' : '#f3f4f6',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)',
			}}>
				{initial}
			</div>

			<div style={{ flex: 1, minWidth: 0 }}>
				{/* Name row */}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
							{entry.from_person?.name ?? entry.from_person_id}
						</span>
						{sentiment && (
							<span style={{
								fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '2px 8px',
								background: isDark ? sentiment.darkBg : sentiment.bg,
								color: isDark ? sentiment.darkText : sentiment.text,
							}}>
								{sentiment.icon} {sentiment.label}
							</span>
						)}
					</div>
					<span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
						{formatDate(entry.created_at)}
					</span>
				</div>

				{/* Content */}
				<div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
					{entry.content}
				</div>
			</div>
		</div>
	)
}

function SkeletonEntry({ isDark }: { isDark: boolean }) {
	const s = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'
	const sd = isDark ? 'rgba(255,255,255,0.13)' : '#e5e7eb'
	return (
		<div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6'}` }}>
			<div style={{ width: 36, height: 36, borderRadius: '50%', background: sd, flexShrink: 0 }} />
			<div style={{ flex: 1 }}>
				<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
					<div style={{ width: 90, height: 13, borderRadius: 6, background: sd }} />
					<div style={{ width: 60, height: 13, borderRadius: 999, background: s }} />
				</div>
				<div style={{ width: '95%', height: 13, borderRadius: 6, background: s, marginBottom: 5 }} />
				<div style={{ width: '75%', height: 13, borderRadius: 6, background: s }} />
			</div>
		</div>
	)
}

export function FeedbackWidget() {
	const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
	const [hasResult, setHasResult] = useState(false)

	function applyResult(params: unknown) {
		const data = (params as { structuredContent?: { feedback?: FeedbackEntry[] } }).structuredContent
		setHasResult(true)
		if (data?.feedback) setFeedback(data.feedback)
	}

	const clearBufferRef = useRef<(() => void) | null>(null)

	const { app, isConnected, error } = useApp({
		appInfo: { name: 'matchmaker-feedback', version: '1.0.0' },
		capabilities: {},
		onAppCreated: app => {
			app.ontoolinput = () => { setHasResult(false); setFeedback([]); clearBufferRef.current?.() }
			app.ontoolresult = applyResult
		},
	})

	const { clearBuffer } = useToolResultBuffer(isConnected, applyResult)
	clearBufferRef.current = clearBuffer

	useHostStyles(app, app?.getHostContext())
	const theme = useDocumentTheme()
	const isDark = theme === 'dark'
	const isLoading = !hasResult

	if (error) return (
		<AppsSDKUIProvider>
			<div style={{ padding: 20 }}>
				<EmptyMessage><EmptyMessage.Title>Connection error</EmptyMessage.Title><EmptyMessage.Description>{error.message}</EmptyMessage.Description></EmptyMessage>
			</div>
		</AppsSDKUIProvider>
	)

	const positiveCount = feedback.filter(f => f.sentiment === 'positive').length
	const negativeCount = feedback.filter(f => f.sentiment === 'negative').length

	return (
		<AppsSDKUIProvider>
			<div style={{
				fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
				padding: '20px 16px 16px', background: 'var(--color-background-primary)',
				color: 'var(--color-text-primary)', minHeight: '100vh', boxSizing: 'border-box',
			}}>
				{/* Header */}
				<div style={{ marginBottom: 4 }}>
					<div style={{ fontSize: 20, fontWeight: 700 }}>
						{isLoading ? 'Loading feedback...' : 'Date Feedback'}
					</div>
					{!isLoading && feedback.length > 0 && (
						<div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
							{feedback.length} response{feedback.length !== 1 ? 's' : ''}
							{positiveCount > 0 && ` · ${positiveCount} positive`}
							{negativeCount > 0 && ` · ${negativeCount} negative`}
						</div>
					)}
				</div>

				{!isLoading && feedback.length === 0 ? (
					<EmptyMessage>
						<EmptyMessage.Title>No feedback yet</EmptyMessage.Title>
						<EmptyMessage.Description>Feedback will appear here after the date.</EmptyMessage.Description>
					</EmptyMessage>
				) : (
					<div>
						{isLoading
							? [0, 1].map(i => <SkeletonEntry key={i} isDark={isDark} />)
							: feedback.map(entry => <FeedbackCard key={entry.id} entry={entry} isDark={isDark} />)
						}
					</div>
				)}
			</div>
		</AppsSDKUIProvider>
	)
}
