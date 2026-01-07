import {
	UserCircle,
	BookOpen,
	FolderKanban,
	Shield,
	Globe,
	TrendingUp,
} from "lucide-react";

let features = [
	{
		name: "You're in the Driver's Seat",
		description:
			"AI assists your matchmaking decisions, never makes them for you",
		icon: UserCircle,
	},
	{
		name: "Smart Note-Taking",
		description:
			"Keep track of friends, family, preferences, and personalities",
		icon: BookOpen,
	},
	{
		name: "Seamless Organization",
		description: "Manage introductions and track feedback in one place",
		icon: FolderKanban,
	},
	{
		name: "Privacy-First",
		description: "Your data is secure with row-level security and encryption",
		icon: Shield,
	},
	{
		name: "Works Anywhere",
		description: "Claude, ChatGPT, or mobile app - use your preferred platform",
		icon: Globe,
	},
	{
		name: "Track Your Success",
		description: "Monitor introduction outcomes and learn what works",
		icon: TrendingUp,
	},
];

export function Features() {
	return (
		<section className="relative overflow-hidden bg-white py-24 sm:py-32 dark:bg-gray-950">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
						Everything you need to be a{" "}
						<span className="text-indigo-600 dark:text-indigo-400">
							great matchmaker
						</span>
					</h2>
					<p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
						AI-assisted tools that help you make meaningful connections while
						keeping you in complete control.
					</p>
				</div>
				<div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
					<dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-x-12 lg:gap-y-12">
						{features.map((feature) => (
							<div
								key={feature.name}
								className="group relative rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:border-sky-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-sky-700"
							>
								<dt className="flex items-center gap-4 text-lg font-bold leading-7 text-gray-900 dark:text-gray-100">
									<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-md transition-transform duration-300 group-hover:scale-110">
										<feature.icon
											className="h-6 w-6 text-white"
											aria-hidden="true"
										/>
									</div>
									{feature.name}
								</dt>
								<dd className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">
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
