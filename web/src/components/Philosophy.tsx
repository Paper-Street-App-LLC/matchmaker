import { Sparkles, User } from "lucide-react";

const cards = [
	{
		icon: Sparkles,
		iconBg: "bg-sky-100 dark:bg-sky-900/30",
		iconColor: "text-sky-600 dark:text-sky-400",
		glowColor: "rgba(14, 165, 233, 0.15)",
		animationDelay: "0s",
		title: "AI does the analysis",
		description:
			"Remembers the details, spots the patterns, and surfaces the connections a human might miss.",
	},
	{
		icon: User,
		iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
		iconColor: "text-indigo-600 dark:text-indigo-400",
		glowColor: "rgba(99, 102, 241, 0.15)",
		animationDelay: "2s",
		title: "You make the call",
		description:
			"The matchmaker makes the introduction — with the context and confidence to get it right.",
	},
];

export function Philosophy() {
	return (
		<section className="relative overflow-hidden bg-gray-50 py-24 dark:bg-gray-900 sm:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-3xl">
					<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
						Technology that stays in the background
					</h2>
					<p className="mt-8 font-display text-xl font-light leading-relaxed text-gray-600 dark:text-gray-400">
						The best introduction you&apos;ve ever gotten probably came from a friend who
						just knew. Someone who understood what you were looking for before you could
						fully explain it yourself.
					</p>
				</div>
				<div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
					{cards.map((card) => (
						<div
							key={card.title}
							className="animate-glow-pulse rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-sky-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-sky-700"
							style={
								{
									"--glow-color": card.glowColor,
									animationDelay: card.animationDelay,
								} as React.CSSProperties
							}
						>
							<div
								className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
							>
								<card.icon className={`h-5 w-5 ${card.iconColor}`} />
							</div>
							<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
								{card.title}
							</h3>
							<p className="mt-4 font-display font-normal leading-relaxed text-gray-600 dark:text-gray-400">
								{card.description}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Decorative background */}
			<div
				className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
				aria-hidden="true"
			>
				<div
					className="relative left-[calc(50%)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-sky-300 to-indigo-300 opacity-20 dark:opacity-10"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>
		</section>
	);
}
