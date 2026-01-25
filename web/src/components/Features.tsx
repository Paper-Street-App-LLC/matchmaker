import { UserCircle, BookOpen, FolderKanban, Shield, Globe, TrendingUp } from "lucide-react";

let features = [
	{
		name: "You're in Control",
		description: "AI assists your decisions, never makes them for you",
		icon: UserCircle,
	},
	{
		name: "Smart Notes",
		description: "Track friends, preferences, and personalities",
		icon: BookOpen,
	},
	{
		name: "Organized",
		description: "Manage introductions and feedback in one place",
		icon: FolderKanban,
	},
	{
		name: "Private",
		description: "Encrypted data with row-level security",
		icon: Shield,
	},
	{
		name: "Flexible",
		description: "Claude, ChatGPT, or mobile app",
		icon: Globe,
	},
	{
		name: "Insightful",
		description: "Track outcomes and learn what works",
		icon: TrendingUp,
	},
];

export function Features() {
	return (
		<section className="relative overflow-hidden bg-gray-50 py-24 dark:bg-gray-900 sm:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
						Everything you need to be a{" "}
						<span className="text-indigo-600 dark:text-indigo-400">great matchmaker</span>
					</h2>
					<p className="mt-6 font-display text-lg font-light leading-8 text-gray-600 dark:text-gray-400">
						AI-assisted tools for meaningful connections. You stay in control.
					</p>
				</div>
				<div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
					<dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-x-12 lg:gap-y-12">
						{features.map(feature => (
							<div
								key={feature.name}
								className="group relative rounded-2xl p-8 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800/50"
							>
								<dt className="flex items-center gap-4 text-lg font-bold leading-7 text-gray-900 dark:text-gray-100">
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-md transition-transform duration-300 group-hover:scale-110">
										<feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
									</div>
									{feature.name}
								</dt>
								<dd className="mt-4 font-display text-base font-normal leading-7 text-gray-600 dark:text-gray-400">
									{feature.description}
								</dd>
							</div>
						))}
					</dl>
				</div>
			</div>

			{/* Decorative background element */}
			<div
				className="absolute right-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu overflow-hidden blur-3xl"
				aria-hidden="true"
			>
				<div
					className="aspect-[1155/678] w-[36.125rem] bg-gradient-to-tr from-indigo-400 to-sky-200 opacity-10"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>
		</section>
	);
}
