let singlesSteps = [
	{
		title: "Tell us about yourself",
		description:
			"Share what matters to you, what you value, and what you're looking for in a partner. Not a profile. A real conversation.",
	},
	{
		title: "Get matched by a person",
		description:
			"A matchmaker reviews your details, uses AI-powered insights, and introduces you to someone when the fit is right.",
	},
	{
		title: "Meet with purpose",
		description:
			"Every introduction comes with a reason. You'll know why your matchmaker believes you two belong in the same room.",
	},
];

let matchmakerSteps = [
	{
		title: "Keep notes on everyone",
		description:
			"Track personalities, preferences, values, and stories for the people in your network.",
	},
	{
		title: "Let AI find what you'd miss",
		description:
			"Matchlight reads your notes and surfaces compatibility across your whole network. You decide what to act on.",
	},
	{
		title: "Track what works",
		description:
			"See how your introductions go. Learn from outcomes and get better over time.",
	},
];

export function HowItWorks() {
	return (
		<section className="relative overflow-hidden bg-white py-24 dark:bg-gray-950 sm:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
						How Matchlight works
					</h2>
					<p className="mt-6 font-display text-lg font-light text-gray-600 dark:text-gray-400">
						Whether you&apos;re ready to be matched or you&apos;re the one making the
						matches.
					</p>
				</div>
				<div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 sm:mt-20 lg:grid-cols-2 lg:gap-16">
					{/* Singles column */}
					<div>
						<h3 className="text-xl font-bold text-sky-600 dark:text-sky-400">
							For singles
						</h3>
						<div className="mt-8 space-y-8">
							{singlesSteps.map((step, index) => (
								<div key={step.title} className="flex gap-4">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
										{index + 1}
									</div>
									<div>
										<h4 className="font-bold text-gray-900 dark:text-gray-100">
											{step.title}
										</h4>
										<p className="mt-2 font-display font-normal leading-relaxed text-gray-600 dark:text-gray-400">
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Matchmakers column */}
					<div>
						<h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
							For matchmakers
						</h3>
						<div className="mt-8 space-y-8">
							{matchmakerSteps.map((step, index) => (
								<div key={step.title} className="flex gap-4">
									<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
										{index + 1}
									</div>
									<div>
										<h4 className="font-bold text-gray-900 dark:text-gray-100">
											{step.title}
										</h4>
										<p className="mt-2 font-display font-normal leading-relaxed text-gray-600 dark:text-gray-400">
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
