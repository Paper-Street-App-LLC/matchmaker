import { useState } from 'react'
import { useApp, useHostStyles, useDocumentTheme } from '@modelcontextprotocol/ext-apps/react'
import { AppsSDKUIProvider } from '@openai/apps-sdk-ui/components/AppsSDKUIProvider'
import { EmptyMessage } from '@openai/apps-sdk-ui/components/EmptyMessage'
import '@openai/apps-sdk-ui/css'

interface Person {
	id: string
	name: string
	age?: number | null
	location?: string | null
	gender?: string | null
	active?: boolean
}

const AVATAR_COLORS = [
	['#f0e6ff', '#7c3aed'],
	['#fce7f3', '#be185d'],
	['#e0f2fe', '#0369a1'],
	['#dcfce7', '#15803d'],
	['#fff7ed', '#c2410c'],
	['#fef9c3', '#a16207'],
]

function avatarColors(name: string, isDark: boolean) {
	const idx = name.charCodeAt(0) % AVATAR_COLORS.length
	const [light, dark] = AVATAR_COLORS[idx]
	return { bg: isDark ? dark + '33' : light, text: isDark ? light : dark }
}

function PersonCard({
	person,
	isDark,
	onClick,
}: {
	person: Person
	isDark: boolean
	onClick: () => void
}) {
	const [hovered, setHovered] = useState(false)
	const { bg, text } = avatarColors(person.name, isDark)
	const initial = person.name.charAt(0).toUpperCase()
	const metaLine = [person.age, person.location].filter(Boolean).join(' · ')

	return (
		<div
			onClick={onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				background: hovered
					? isDark ? 'rgba(255,255,255,0.09)' : '#f3f4f6'
					: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
				border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
				boxShadow: isDark ? 'none' : hovered ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
				borderRadius: 14,
				padding: '20px 16px',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 8,
				cursor: 'pointer',
				textAlign: 'center',
				transition: 'background 0.15s, box-shadow 0.15s',
			}}
		>
			<div
				style={{
					width: 52,
					height: 52,
					borderRadius: '50%',
					background: bg,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 20,
					fontWeight: 700,
					color: text,
				}}
			>
				{initial}
			</div>

			<div
				style={{
					fontSize: 15,
					fontWeight: 600,
					color: 'var(--color-text-primary)',
					lineHeight: 1.3,
				}}
			>
				{person.name}
			</div>

			{metaLine && (
				<div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
					{metaLine}
				</div>
			)}

			{person.gender && (
				<div
					style={{
						fontSize: 11,
						fontWeight: 500,
						color: text,
						background: bg,
						borderRadius: 999,
						padding: '2px 10px',
						textTransform: 'capitalize',
					}}
				>
					{person.gender}
				</div>
			)}
		</div>
	)
}

function SkeletonCard({ isDark }: { isDark: boolean }) {
	const shimmer = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6'
	const shimmerDark = isDark ? 'rgba(255,255,255,0.13)' : '#e5e7eb'

	return (
		<div
			style={{
				background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
				border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
				borderRadius: 14,
				padding: '20px 16px',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 8,
			}}
		>
			<div style={{ width: 52, height: 52, borderRadius: '50%', background: shimmerDark }} />
			<div style={{ width: 90, height: 14, borderRadius: 6, background: shimmerDark }} />
			<div style={{ width: 70, height: 12, borderRadius: 6, background: shimmer }} />
			<div style={{ width: 50, height: 20, borderRadius: 999, background: shimmer }} />
		</div>
	)
}

export function PeopleWidget() {
	const [people, setPeople] = useState<Person[]>([])
	const [hasResult, setHasResult] = useState(false)

	const { app, isConnected, error } = useApp({
		appInfo: { name: 'matchmaker-people', version: '1.0.0' },
		capabilities: {},
		onAppCreated: app => {
			app.ontoolinput = () => {
				setHasResult(false)
				setPeople([])
			}
			app.ontoolresult = result => {
				const data = (result as { structuredContent?: { people?: Person[] } }).structuredContent
				setHasResult(true)
				if (data?.people) setPeople(data.people)
			}
		},
	})

	useHostStyles(app, app?.getHostContext())
	const theme = useDocumentTheme()
	const isDark = theme === 'dark'

	if (error) {
		return (
			<AppsSDKUIProvider>
				<div style={{ padding: 20 }}>
					<EmptyMessage>
						<EmptyMessage.Title>Connection error</EmptyMessage.Title>
						<EmptyMessage.Description>{error.message}</EmptyMessage.Description>
					</EmptyMessage>
				</div>
			</AppsSDKUIProvider>
		)
	}

	const isLoading = !hasResult

	return (
		<AppsSDKUIProvider>
			<div
				style={{
					fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
					padding: '20px 16px 16px',
					background: 'var(--color-background-primary)',
					color: 'var(--color-text-primary)',
					minHeight: '100vh',
					boxSizing: 'border-box',
				}}
			>
				<div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
					{isLoading ? 'Loading roster...' : `Your Clients (${people.length})`}
				</div>

				{!isLoading && people.length === 0 ? (
					<EmptyMessage>
						<EmptyMessage.Title>No clients yet</EmptyMessage.Title>
						<EmptyMessage.Description>Add your first client to get started.</EmptyMessage.Description>
					</EmptyMessage>
				) : (
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, 1fr)',
							gap: 10,
						}}
					>
						{isLoading
							? [0, 1, 2, 3].map(i => <SkeletonCard key={i} isDark={isDark} />)
							: people.map(person => (
									<PersonCard
										key={person.id}
										person={person}
										isDark={isDark}
										onClick={() =>
											app?.sendMessage({
												role: 'user',
												content: [
													{
														type: 'text',
														text: `Show me the profile for ${person.name} (id: ${person.id})`,
													},
												],
											})
										}
									/>
								))}
					</div>
				)}
			</div>
		</AppsSDKUIProvider>
	)
}
