import { useRef, useState } from 'react'
import { useApp, useHostStyles, useDocumentTheme } from '@modelcontextprotocol/ext-apps/react'
import { useToolResultBuffer } from './useToolResult'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import '@openai/apps-sdk-ui/css'

interface PersonPersonality { traits?: string[]; interests?: string[] }
interface PersonPreferences { ageRange?: { min?: number; max?: number }; genders?: string[]; locations?: string[] }
interface Person {
	id: string; name: string; age?: number | null; location?: string | null
	gender?: string | null; personality?: PersonPersonality | null; preferences?: PersonPreferences | null; notes?: string | null
}
interface Introduction {
	id: string; person_a_id: string; person_b_id: string
	person_a?: Person | null; person_b?: Person | null
	status: string; notes?: string | null; created_at: string; updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; darkBg: string; darkText: string }> = {
	pending:  { label: 'Pending',  bg: '#fef9c3', text: '#a16207', darkBg: 'rgba(234,179,8,0.18)',  darkText: '#fde047' },
	dating:   { label: 'Dating',   bg: '#dcfce7', text: '#15803d', darkBg: 'rgba(34,197,94,0.18)',  darkText: '#86efac' },
	accepted: { label: 'Accepted', bg: '#e0f2fe', text: '#0369a1', darkBg: 'rgba(14,165,233,0.18)', darkText: '#7dd3fc' },
	declined: { label: 'Declined', bg: '#fee2e2', text: '#b91c1c', darkBg: 'rgba(239,68,68,0.18)',  darkText: '#fca5a5' },
	ended:    { label: 'Ended',    bg: '#f3f4f6', text: '#6b7280', darkBg: 'rgba(107,114,128,0.18)',darkText: '#9ca3af' },
}

function formatDate(iso: string) {
	if (!iso) return ''
	return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Pill({ label, isDark, accent }: { label: string; isDark: boolean; accent?: boolean }) {
	return (
		<span style={{
			fontSize: 12, borderRadius: 999, padding: '3px 10px', display: 'inline-block',
			background: accent
				? isDark ? 'rgba(99,102,241,0.2)' : '#ede9fe'
				: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
			color: accent
				? isDark ? '#a5b4fc' : '#6d28d9'
				: 'var(--color-text-secondary)',
		}}>
			{label}
		</span>
	)
}

function PersonCard({ person, isDark, onView }: { person: Person; isDark: boolean; onView: () => void }) {
	const initial = person.name.charAt(0).toUpperCase()
	const traits = person.personality?.traits ?? []
	const interests = person.personality?.interests ?? []

	return (
		<div style={{
			flex: 1, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
			border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
			borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10,
		}}>
			{/* Avatar + name */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<div style={{
					width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
					background: isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)',
				}}>
					{initial}
				</div>
				<div>
					<div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{person.name}</div>
					<div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
						{[person.age, person.location].filter(Boolean).join(' · ')}
					</div>
				</div>
			</div>

			{/* Traits */}
			{traits.length > 0 && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
					{traits.map(t => <Pill key={t} label={t} isDark={isDark} accent />)}
				</div>
			)}

			{/* Interests */}
			{interests.length > 0 && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
					{interests.map(i => <Pill key={i} label={i} isDark={isDark} />)}
				</div>
			)}

			{/* View profile button */}
			<button
				onClick={onView}
				style={{
					marginTop: 'auto', width: '100%', padding: '8px', borderRadius: 8, cursor: 'pointer',
					border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
					background: 'transparent', fontSize: 13, fontWeight: 500,
					color: 'var(--color-text-primary)', fontFamily: 'inherit',
				}}
			>
				View Profile
			</button>
		</div>
	)
}

function SkeletonProfile({ isDark }: { isDark: boolean }) {
	const s = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'
	const sd = isDark ? 'rgba(255,255,255,0.13)' : '#e5e7eb'
	return (
		<div style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, borderRadius: 12, padding: 14 }}>
			<div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
				<div style={{ width: 40, height: 40, borderRadius: '50%', background: sd, flexShrink: 0 }} />
				<div><div style={{ width: 90, height: 14, borderRadius: 6, background: sd }} /><div style={{ width: 70, height: 11, borderRadius: 6, background: s, marginTop: 5 }} /></div>
			</div>
			<div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>{[60,50,70].map(w => <div key={w} style={{ width: w, height: 22, borderRadius: 999, background: s }} />)}</div>
			<div style={{ width: '100%', height: 34, borderRadius: 8, background: s, marginTop: 'auto' }} />
		</div>
	)
}

export function IntroductionWidget() {
	const [introduction, setIntroduction] = useState<Introduction | null>(null)
	const [hasResult, setHasResult] = useState(false)

	function applyResult(params: unknown) {
		const data = (params as { structuredContent?: { introduction?: Introduction } }).structuredContent
		setHasResult(true)
		if (data?.introduction) setIntroduction(data.introduction)
	}

	const clearBufferRef = useRef<(() => void) | null>(null)

	const { app, isConnected, error } = useApp({
		appInfo: { name: 'matchmaker-introduction', version: '1.0.0' },
		capabilities: {},
		onAppCreated: app => {
			app.ontoolinput = () => { setHasResult(false); setIntroduction(null); clearBufferRef.current?.() }
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

	const status = introduction ? (STATUS_CONFIG[introduction.status] ?? STATUS_CONFIG.pending) : null
	const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'

	return (
		<AppsSDKUIProvider>
			<div style={{
				fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
				padding: '20px 16px 16px', background: 'var(--color-background-primary)',
				color: 'var(--color-text-primary)', minHeight: '100vh', boxSizing: 'border-box',
			}}>
				{/* Header */}
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
					<div style={{ fontSize: 20, fontWeight: 700 }}>
						{isLoading ? 'Loading...' : `${introduction?.person_a?.name ?? '—'} & ${introduction?.person_b?.name ?? '—'}`}
					</div>
					{!isLoading && status && (
						<span style={{
							fontSize: 12, fontWeight: 600, borderRadius: 999, padding: '4px 12px',
							background: isDark ? status.darkBg : status.bg,
							color: isDark ? status.darkText : status.text,
						}}>
							{status.label}
						</span>
					)}
				</div>

				{/* Side-by-side profiles */}
				<div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
					{isLoading ? (
						<><SkeletonProfile isDark={isDark} /><SkeletonProfile isDark={isDark} /></>
					) : (
						<>
							{introduction?.person_a && (
								<PersonCard person={introduction.person_a} isDark={isDark} onView={() =>
									app?.sendMessage({ role: 'user', content: [{ type: 'text', text: `Show me the profile for ${introduction.person_a!.name} (id: ${introduction.person_a!.id})` }] })
								} />
							)}
							{introduction?.person_b && (
								<PersonCard person={introduction.person_b} isDark={isDark} onView={() =>
									app?.sendMessage({ role: 'user', content: [{ type: 'text', text: `Show me the profile for ${introduction.person_b!.name} (id: ${introduction.person_b!.id})` }] })
								} />
							)}
						</>
					)}
				</div>

				{/* Notes */}
				{!isLoading && introduction?.notes && (
					<div style={{
						background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb',
						border: `1px solid ${cardBorder}`, borderRadius: 12, padding: 14, marginBottom: 14,
					}}>
						<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
							Matchmaker Notes
						</div>
						<div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
							{introduction.notes}
						</div>
					</div>
				)}

				{/* Footer: date + feedback button */}
				{!isLoading && introduction && (
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
							Introduced {formatDate(introduction.created_at)}
						</div>
						<button
							onClick={() => app?.sendMessage({
								role: 'user',
								content: [{ type: 'text', text: `Show feedback for introduction ${introduction.id}` }],
							})}
							style={{
								padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
								border: `1px solid ${cardBorder}`, background: 'transparent',
								fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'inherit',
							}}
						>
							View Feedback
						</button>
					</div>
				)}
			</div>
		</AppsSDKUIProvider>
	)
}
