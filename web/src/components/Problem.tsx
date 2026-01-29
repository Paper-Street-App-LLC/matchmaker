import { type LucideIcon, ScrollText, UserX, Scale } from "lucide-react";

let problems: { icon: LucideIcon; title: string; description: string }[] = [
	{
		icon: ScrollText,
		title: "Built to keep you scrolling",
		description:
			"Most apps are designed around engagement, not outcomes. The longer you stay on, the better it is for them.",
	},
	{
		icon: UserX,
		title: "Profiles aren't people",
		description:
			"A photo and a few lines of text can't tell you if someone shares your sense of humor, your values, or your vision for life.",
	},
	{
		icon: Scale,
		title: "Good matches take good judgment",
		description:
			"The best introductions come from people who know both sides. That's something software alone has never been able to do.",
	},
];

export function Problem() {
	return (
		<section className="relative overflow-hidden bg-white py-24 dark:bg-gray-950 sm:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
						Finding your person shouldn&apos;t feel like this
					</h2>
					<p className="mt-6 font-display text-lg font-light text-gray-600 dark:text-gray-400">
						More options than ever, but finding the right match hasn&apos;t gotten easier.
					</p>
				</div>
				<div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:mt-20 md:grid-cols-3">
					{problems.map((problem) => (
						<div
							key={problem.title}
							className="rounded-2xl border border-gray-200 bg-gray-50 p-8 transition-all hover:border-sky-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-sky-700"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
								<problem.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							</div>
							<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
								{problem.title}
							</h3>
							<p className="mt-4 font-display font-normal leading-relaxed text-gray-600 dark:text-gray-400">
								{problem.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
