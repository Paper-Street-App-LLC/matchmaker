import { useRef, useState } from 'react'
import { useApp, useHostStyles, useDocumentTheme } from '@modelcontextprotocol/ext-apps/react'
import { useToolResultBuffer } from './useToolResult'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import '@openai/apps-sdk-ui/css'

interface PersonPreferences {
	ageRange?: { min?: number; max?: number }
	locations?: string[]
	genders?: string[]
}

interface PersonPersonality {
	traits?: string[]
	interests?: string[]
}

interface Person {
	id: string
	name: string
	age?: number | null
	location?: string | null
	gender?: string | null
	personality?: PersonPersonality | null
	preferences?: PersonPreferences | null
	notes?: string | null
	active?: boolean
}

function getInitial(name: string) {
	return name.charAt(0).toUpperCase() + '.'
}

function Pill({ label, isDark }: { label: string; isDark: boolean }) {
	return (
		<span
			style={{
				display: 'inline-block',
				padding: '4px 12px',
				borderRadius: 999,
				fontSize: 13,
				fontWeight: 500,
				background: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
				color: 'var(--color-text-secondary)',
				whiteSpace: 'nowrap',
			}}
		>
			{label}
		</span>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div style={{ width: '100%' }}>
			<div
				style={{
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: '0.06em',
					textTransform: 'uppercase',
					color: 'var(--color-text-tertiary)',
					marginBottom: 8,
				}}
			>
				{title}
			</div>
			{children}
		</div>
	)
}

export function PersonWidget() {
	const [person, setPerson] = useState<Person | null>(null)
	const [hasResult, setHasResult] = useState(false)

	function applyResult(params: unknown) {
		const data = (params as { structuredContent?: { person?: Person } }).structuredContent
		setHasResult(true)
		if (data?.person) setPerson(data.person)
	}

	const clearBufferRef = useRef<(() => void) | null>(null)

	const { app, isConnected, error } = useApp({
		appInfo: { name: 'matchmaker-person', version: '1.0.0' },
		capabilities: {},
		onAppCreated: (app) => {
			app.ontoolinput = () => { setHasResult(false); setPerson(null); clearBufferRef.current?.() }
			app.ontoolresult = applyResult
		},
	})

	const { clearBuffer } = useToolResultBuffer(isConnected, applyResult)
	clearBufferRef.current = clearBuffer

	useHostStyles(app, app?.getHostContext())
	const theme = useDocumentTheme()
	const isDark = theme === 'dark'

	const cardBg = isDark ? 'rgba(255,255,255,0.07)' : '#ffffff'
	const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'
	const cardShadow = isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)'

	if (error) {
		return (
			<AppsSDKUIProvider>
				<EmptyMessage>
					<EmptyMessage.Title>Connection error</EmptyMessage.Title>
					<EmptyMessage.Description>{error.message}</EmptyMessage.Description>
				</EmptyMessage>
			</AppsSDKUIProvider>
		)
	}

	if (!hasResult) {
		return (
			<AppsSDKUIProvider>
				<div style={{ padding: '24px 20px', fontFamily: 'var(--font-sans, sans-serif)', background: 'var(--color-background-primary)', minHeight: '100vh', boxSizing: 'border-box' }}>
					{/* Skeleton */}
					<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, borderRadius: 16, padding: '32px 24px' }}>
						<div style={{ width: 80, height: 80, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb' }} />
						<div style={{ width: 140, height: 18, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }} />
						<div style={{ width: 100, height: 14, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }} />
						<div style={{ width: '100%', height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6', margin: '4px 0' }} />
						<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
							{[80, 100, 70, 90].map((w, i) => (
								<div key={i} style={{ width: w, height: 28, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }} />
							))}
						</div>
					</div>
				</div>
			</AppsSDKUIProvider>
		)
	}

	if (!person) {
		return (
			<AppsSDKUIProvider>
				<EmptyMessage>
					<EmptyMessage.Title>Person not found</EmptyMessage.Title>
				</EmptyMessage>
			</AppsSDKUIProvider>
		)
	}

	const metaParts = [person.age, person.location, person.gender].filter(Boolean)
	const traits = person.personality?.traits ?? []
	const interests = person.personality?.interests ?? []
	const prefs = person.preferences
	const prefParts: string[] = []
	if (prefs?.ageRange?.min || prefs?.ageRange?.max) {
		prefParts.push(`Ages ${prefs.ageRange?.min ?? '?'}–${prefs.ageRange?.max ?? '?'}`)
	}
	if (prefs?.locations?.length) prefParts.push(...prefs.locations)
	if (prefs?.genders?.length) prefParts.push(...prefs.genders)

	return (
		<AppsSDKUIProvider>
			<div
				style={{
					fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
					padding: '24px 20px',
					background: 'var(--color-background-primary)',
					color: 'var(--color-text-primary)',
					minHeight: '100vh',
					maxWidth: '100%',
					boxSizing: 'border-box',
				}}
			>
				<div
					style={{
						background: cardBg,
						border: `1px solid ${cardBorder}`,
						boxShadow: cardShadow,
						borderRadius: 16,
						padding: '32px 24px 24px',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: 20,
					}}
				>
					{/* Avatar */}
					<div
						style={{
							width: 80,
							height: 80,
							borderRadius: '50%',
							background: isDark ? 'rgba(255,255,255,0.12)' : '#f3f4f6',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 28,
							fontWeight: 500,
							color: 'var(--color-text-primary)',
						}}
					>
						{getInitial(person.name)}
					</div>

					{/* Name */}
					<div style={{ textAlign: 'center' }}>
						<div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
							{person.name}
						</div>
						{metaParts.length > 0 && (
							<div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
								{metaParts.join(' · ')}
							</div>
						)}
					</div>

					<div style={{ width: '100%', height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }} />

					{/* Interests */}
					{interests.length > 0 && (
						<Section title="Interests">
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
								{interests.map(i => <Pill key={i} label={i} isDark={isDark} />)}
							</div>
						</Section>
					)}

					{/* Personality */}
					{traits.length > 0 && (
						<Section title="Personality">
							<div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
								{traits.join(', ')}
							</div>
						</Section>
					)}

					{/* Looking for */}
					{prefParts.length > 0 && (
						<Section title="Looking for">
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
								{prefParts.map(p => <Pill key={p} label={p} isDark={isDark} />)}
							</div>
						</Section>
					)}

					{/* Matchmaker notes */}
					{person.notes && (
						<Section title="Matchmaker notes">
							<div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
								"{person.notes}"
							</div>
						</Section>
					)}

					<div style={{ width: '100%', height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }} />

					{/* Actions */}
					<div style={{ display: 'flex', gap: 10, width: '100%' }}>
						<button
							onClick={() => app?.openLink({ url: 'https://theintroduction.ai' })}
							style={{
								flex: 1,
								padding: '10px 16px',
								border: `1px solid ${cardBorder}`,
								borderRadius: 999,
								background: 'transparent',
								fontSize: 14,
								fontWeight: 500,
								color: 'var(--color-text-primary)',
								cursor: 'pointer',
								fontFamily: 'inherit',
							}}
						>
							Send Message
						</button>
						<button
							onClick={() => app?.openLink({ url: 'https://introduction.ai' })}
							style={{
								flex: 1,
								padding: '10px 16px',
								border: 'none',
								borderRadius: 999,
								background: isDark ? 'rgba(255,255,255,0.15)' : '#111827',
								fontSize: 14,
								fontWeight: 500,
								color: isDark ? 'var(--color-text-primary)' : '#ffffff',
								cursor: 'pointer',
								fontFamily: 'inherit',
							}}
						>
							Introduce
						</button>
					</div>
				</div>
			</div>
		</AppsSDKUIProvider>
	)
}
