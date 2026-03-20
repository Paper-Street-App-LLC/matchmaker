import { useRef, useState } from 'react'
import {
	useApp,
	useHostStyles,
	useDocumentTheme,
	type App,
} from '@modelcontextprotocol/ext-apps/react'
import { useToolResultBuffer } from './useToolResult'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import '@openai/apps-sdk-ui/css'

interface MatchPerson {
	id: string
	name: string
	age?: number | null
	location?: string | null
}

interface Match {
	person?: MatchPerson
	about?: string
	matchmaker_note?: string
}

function getInitial(name: string) {
	return name.charAt(0).toUpperCase() + '.'
}

function MatchCard({
	match,
	isDark,
	onRequest,
	onViewProfile,
}: {
	match: Match
	isDark: boolean
	onRequest: () => void
	onViewProfile: () => void
}) {
	const { person, about, matchmaker_note } = match
	if (!person) return null

	const metaLine = [person.age, person.location].filter(Boolean).join(' · ')

	return (
		<div
			onClick={() => {
				console.log('[MatchCard] clicked, person.id:', person.id)
				onViewProfile()
			}}
			style={{
				flexShrink: 0,
				width: 240,
				background: isDark ? 'rgba(255,255,255,0.07)' : '#ffffff',
				border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
				boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
				borderRadius: 16,
				padding: '24px 20px 20px',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 12,
				textAlign: 'center',
				cursor: 'pointer',
			}}
		>
			{/* Avatar circle */}
			<div
				style={{
					width: 64,
					height: 64,
					borderRadius: '50%',
					background: isDark ? 'rgba(255,255,255,0.12)' : '#f3f4f6',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 22,
					fontWeight: 500,
					color: 'var(--color-text-primary)',
					letterSpacing: '-0.5px',
				}}
			>
				{getInitial(person.name)}
			</div>

			{/* Age · City */}
			{metaLine && (
				<div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 400 }}>
					{metaLine}
				</div>
			)}

			{/* About */}
			{about && (
				<div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
					{about}
				</div>
			)}

			{/* Matchmaker note */}
			{matchmaker_note && (
				<div style={{ fontSize: 14, color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
					{matchmaker_note}
				</div>
			)}

			{/* CTA */}
			<button
				style={{
					marginTop: 4,
					width: '100%',
					padding: '10px 16px',
					border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
					borderRadius: 999,
					background: 'transparent',
					fontSize: 14,
					fontWeight: 500,
					color: 'var(--color-text-primary)',
					cursor: 'pointer',
					fontFamily: 'inherit',
				}}
				onClick={e => { e.stopPropagation(); onRequest() }}
			>
				Request Full Introduction
			</button>
		</div>
	)
}

function SkeletonCard({ isDark }: { isDark: boolean }) {
	const shimmer = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'
	const shimmerDark = isDark ? 'rgba(255,255,255,0.13)' : '#e5e7eb'

	return (
		<div
			style={{
				flexShrink: 0,
				width: 240,
				background: isDark ? 'rgba(255,255,255,0.07)' : '#ffffff',
				border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
				boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
				borderRadius: 16,
				padding: '24px 20px 20px',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 12,
			}}
		>
			<div style={{ width: 64, height: 64, borderRadius: '50%', background: shimmerDark }} />
			<div style={{ width: 100, height: 14, borderRadius: 6, background: shimmer }} />
			<div style={{ width: 160, height: 14, borderRadius: 6, background: shimmer }} />
			<div style={{ width: 130, height: 14, borderRadius: 6, background: shimmer }} />
			<div
				style={{ width: '100%', height: 40, borderRadius: 999, background: shimmer, marginTop: 4 }}
			/>
		</div>
	)
}

export function MatchesWidget() {
	const [matches, setMatches] = useState<Match[]>([])
	const [hasResult, setHasResult] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)
	const [activeIndex, setActiveIndex] = useState(0)

	function applyResult(params: unknown) {
		const data = (params as { structuredContent?: { matches?: Match[] } }).structuredContent
		setHasResult(true)
		if (data?.matches) { setMatches(data.matches); setActiveIndex(0) }
	}

	const clearBufferRef = useRef<(() => void) | null>(null)

	const { app, isConnected, error } = useApp({
		appInfo: { name: 'matchmaker-matches', version: '1.0.0' },
		capabilities: {},
		onAppCreated: app => {
			app.ontoolinput = () => { setHasResult(false); setMatches([]); setActiveIndex(0); clearBufferRef.current?.() }
			app.ontoolresult = applyResult
		},
	})

	const { clearBuffer } = useToolResultBuffer(isConnected, applyResult)
	clearBufferRef.current = clearBuffer

	useHostStyles(app, app?.getHostContext())
	const theme = useDocumentTheme()
	const isDark = theme === 'dark'

	function onScroll() {
		const el = scrollRef.current
		if (!el) return
		const cardWidth = 240 + 16
		setActiveIndex(Math.round(el.scrollLeft / cardWidth))
	}

	if (error) {
		return (
			<AppsSDKUIProvider>
				<div style={{ padding: 20, fontFamily: 'sans-serif' }}>
					<EmptyMessage>
						<EmptyMessage.Title>Connection error</EmptyMessage.Title>
						<EmptyMessage.Description>{error.message}</EmptyMessage.Description>
					</EmptyMessage>
				</div>
			</AppsSDKUIProvider>
		)
	}

	return (
		<AppsSDKUIProvider>
			<div
				style={{
					fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
					padding: '24px 20px 20px',
					background: 'var(--color-background-primary)',
					color: 'var(--color-text-primary)',
					minHeight: '100vh',
					maxWidth: '100%',
					boxSizing: 'border-box',
				}}
			>
				{!hasResult ? (
					<>
						<div
							style={{
								fontSize: 20,
								fontWeight: 700,
								color: 'var(--color-text-primary)',
								marginBottom: 16,
							}}
						>
							Finding your matches...
						</div>
						<div
							style={{
								display: 'flex',
								gap: 16,
								overflow: 'hidden',
								width: '100%',
								boxSizing: 'border-box',
							}}
						>
							{[0, 1, 2].map(i => (
								<SkeletonCard key={i} isDark={isDark} />
							))}
						</div>
					</>
				) : matches.length === 0 ? (
					<EmptyMessage>
						<EmptyMessage.Title>No matches found</EmptyMessage.Title>
						<EmptyMessage.Description>
							Try updating preferences to find compatible people.
						</EmptyMessage.Description>
					</EmptyMessage>
				) : (
					<>
						<div
							style={{
								fontSize: 20,
								fontWeight: 700,
								color: 'var(--color-text-primary)',
								marginBottom: 16,
							}}
						>
							Your Matchmaker's Top Picks
						</div>

						{/* Horizontal scroll row */}
						<div
							ref={scrollRef}
							onScroll={onScroll}
							style={{
								display: 'flex',
								gap: 16,
								overflowX: 'auto',
								scrollSnapType: 'x mandatory',
								paddingBottom: 8,
								scrollbarWidth: 'none',
								width: '100%',
								boxSizing: 'border-box',
							}}
						>
							{matches.map((match, i) => (
								<div key={match.person?.id ?? i} style={{ scrollSnapAlign: 'start' }}>
									<MatchCard
										match={match}
										isDark={isDark}
										onRequest={() => app?.openLink({ url: 'https://theintroduction.ai' })}
										onViewProfile={() => {
											console.log('[MatchesWidget] onViewProfile called, app:', !!app, 'person:', match.person?.id)
											if (match.person) {
												console.log('[MatchesWidget] sending message to trigger get_person:', match.person.id)
												app?.sendMessage({
													role: 'user',
													content: [{ type: 'text', text: `Show me the profile for ${match.person.name} (id: ${match.person.id})` }],
												})
													.then((r: unknown) => console.log('[MatchesWidget] sendMessage result:', r))
													.catch((e: unknown) => console.error('[MatchesWidget] sendMessage error:', e))
											}
										}}
									/>
								</div>
							))}
						</div>

						{/* Dot indicators */}
						{matches.length > 1 && (
							<div
								style={{
									display: 'flex',
									justifyContent: 'center',
									gap: 6,
									marginTop: 16,
								}}
							>
								{matches.map((_, i) => (
									<div
										key={i}
										style={{
											width: 6,
											height: 6,
											borderRadius: '50%',
											background:
												i === activeIndex
													? 'var(--color-text-primary)'
													: 'var(--color-text-tertiary)',
											transition: 'background 0.2s',
										}}
									/>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</AppsSDKUIProvider>
	)
}
