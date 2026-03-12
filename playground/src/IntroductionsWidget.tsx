import { useRef, useState } from 'react'
import { useApp, useHostStyles, useDocumentTheme } from '@modelcontextprotocol/ext-apps/react'
import { useToolResultBuffer } from './useToolResult'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import '@openai/apps-sdk-ui/css'

interface Person {
	id: string
	name: string
	age?: number | null
	location?: string | null
}

interface Introduction {
	id: string
	person_a_id: string
	person_b_id: string
	person_a?: Person | null
	person_b?: Person | null
	status: string
	notes?: string | null
	created_at: string
	updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; darkBg: string; darkText: string }> = {
	pending:  { label: 'Pending',  bg: '#fef9c3', text: '#a16207', darkBg: 'rgba(234,179,8,0.18)',  darkText: '#fde047' },
	dating:   { label: 'Dating',   bg: '#dcfce7', text: '#15803d', darkBg: 'rgba(34,197,94,0.18)',  darkText: '#86efac' },
	accepted: { label: 'Accepted', bg: '#e0f2fe', text: '#0369a1', darkBg: 'rgba(14,165,233,0.18)', darkText: '#7dd3fc' },
	declined: { label: 'Declined', bg: '#fee2e2', text: '#b91c1c', darkBg: 'rgba(239,68,68,0.18)',  darkText: '#fca5a5' },
	ended:    { label: 'Ended',    bg: '#f3f4f6', text: '#6b7280', darkBg: 'rgba(107,114,128,0.18)',darkText: '#9ca3af' },
}

function getInitial(name: string) {
	return name.charAt(0).toUpperCase()
}

function formatDate(iso: string) {
	if (!iso) return ''
	return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Avatar({ name, isDark, size = 36 }: { name: string; isDark: boolean; size?: number }) {
	return (
		<div style={{
			width: size, height: size, borderRadius: '50%', flexShrink: 0,
			background: isDark ? 'rgba(255,255,255,0.12)' : '#f3f4f6',
			display: 'flex', alignItems: 'center', justifyContent: 'center',
			fontSize: size * 0.4, fontWeight: 600, color: 'var(--color-text-primary)',
		}}>
			{getInitial(name)}
		</div>
	)
}

function IntroCard({ intro, isDark, onView }: { intro: Introduction; isDark: boolean; onView: () => void }) {
	const [hovered, setHovered] = useState(false)
	const status = STATUS_CONFIG[intro.status] ?? STATUS_CONFIG.pending
	const personA = intro.person_a
	const personB = intro.person_b

	return (
		<div
			onClick={onView}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				background: hovered
					? isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb'
					: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
				border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
				boxShadow: isDark ? 'none' : hovered ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
				borderRadius: 14,
				padding: '16px',
				cursor: 'pointer',
				transition: 'background 0.15s, box-shadow 0.15s',
			}}
		>
			{/* People row */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
				{personA && <Avatar name={personA.name} isDark={isDark} />}
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
						{personA?.name ?? '—'}
					</div>
					{personA?.location && (
						<div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{personA.location}</div>
					)}
				</div>

				{/* Heart connector */}
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
					<path d="M8 13.5S1.5 9.5 1.5 5.5a3 3 0 0 1 6.5-1 3 3 0 0 1 6.5 1C14.5 9.5 8 13.5 8 13.5z" fill="currentColor" />
				</svg>

				<div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
					<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
						{personB?.name ?? '—'}
					</div>
					{personB?.location && (
						<div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{personB.location}</div>
					)}
				</div>
				{personB && <Avatar name={personB.name} isDark={isDark} />}
			</div>

			{/* Notes */}
			{intro.notes && (
				<div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 10,
					display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
					{intro.notes}
				</div>
			)}

			{/* Footer: status + date */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<span style={{
					fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px',
					background: isDark ? status.darkBg : status.bg,
					color: isDark ? status.darkText : status.text,
					textTransform: 'capitalize',
				}}>
					{status.label}
				</span>
				<span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
					{formatDate(intro.created_at)}
				</span>
			</div>
		</div>
	)
}

function SkeletonCard({ isDark }: { isDark: boolean }) {
	const s = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'
	const sd = isDark ? 'rgba(255,255,255,0.13)' : '#e5e7eb'
	return (
		<div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`, borderRadius: 14, padding: 16 }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
				<div style={{ width: 36, height: 36, borderRadius: '50%', background: sd, flexShrink: 0 }} />
				<div style={{ flex: 1 }}>
					<div style={{ width: 80, height: 13, borderRadius: 6, background: sd }} />
					<div style={{ width: 60, height: 11, borderRadius: 6, background: s, marginTop: 5 }} />
				</div>
				<div style={{ width: 16, height: 16, borderRadius: '50%', background: s, flexShrink: 0 }} />
				<div style={{ flex: 1, textAlign: 'right' }}>
					<div style={{ width: 80, height: 13, borderRadius: 6, background: sd, marginLeft: 'auto' }} />
					<div style={{ width: 60, height: 11, borderRadius: 6, background: s, marginTop: 5, marginLeft: 'auto' }} />
				</div>
				<div style={{ width: 36, height: 36, borderRadius: '50%', background: sd, flexShrink: 0 }} />
			</div>
			<div style={{ width: '90%', height: 12, borderRadius: 6, background: s, marginBottom: 6 }} />
			<div style={{ width: '70%', height: 12, borderRadius: 6, background: s, marginBottom: 12 }} />
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<div style={{ width: 64, height: 20, borderRadius: 999, background: s }} />
				<div style={{ width: 72, height: 12, borderRadius: 6, background: s }} />
			</div>
		</div>
	)
}

export function IntroductionsWidget() {
	const [introductions, setIntroductions] = useState<Introduction[]>([])
	const [hasResult, setHasResult] = useState(false)

	function applyResult(params: unknown) {
		const data = (params as { structuredContent?: { introductions?: Introduction[] } }).structuredContent
		setHasResult(true)
		if (data?.introductions) setIntroductions(data.introductions)
	}

	const clearBufferRef = useRef<(() => void) | null>(null)

	const { app, isConnected, error } = useApp({
		appInfo: { name: 'matchmaker-introductions', version: '1.0.0' },
		capabilities: {},
		onAppCreated: app => {
			app.ontoolinput = () => { setHasResult(false); setIntroductions([]); clearBufferRef.current?.() }
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

	return (
		<AppsSDKUIProvider>
			<div style={{
				fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
				padding: '20px 16px 16px',
				background: 'var(--color-background-primary)',
				color: 'var(--color-text-primary)',
				minHeight: '100vh',
				boxSizing: 'border-box',
			}}>
				<div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
					{isLoading ? 'Loading introductions...' : `Introductions (${introductions.length})`}
				</div>

				{!isLoading && introductions.length === 0 ? (
					<EmptyMessage>
						<EmptyMessage.Title>No introductions yet</EmptyMessage.Title>
						<EmptyMessage.Description>Create your first introduction to get started.</EmptyMessage.Description>
					</EmptyMessage>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
						{isLoading
							? [0, 1, 2].map(i => <SkeletonCard key={i} isDark={isDark} />)
							: introductions.map(intro => (
								<IntroCard
									key={intro.id}
									intro={intro}
									isDark={isDark}
									onView={() => app?.sendMessage({
										role: 'user',
										content: [{ type: 'text', text: `Show me introduction ${intro.id}` }],
									})}
								/>
							))
						}
					</div>
				)}
			</div>
		</AppsSDKUIProvider>
	)
}
