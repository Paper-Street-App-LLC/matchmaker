import { Terminal } from "lucide-react";

export function SmartNotesDemo() {
	return (
		<section className="relative bg-gradient-to-b from-gray-50 to-white py-24 sm:py-32 dark:from-gray-900 dark:to-gray-950">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-gray-100">
						Natural conversation,
						<br />
						<span className="text-sky-600 dark:text-sky-400">
							powerful results
						</span>
					</h2>
					<p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
						Use The Introduction in Claude Chat, ChatGPT, or our mobile app
						(coming soon)
					</p>
				</div>

				<div className="mx-auto mt-16 max-w-5xl">
					{/* Terminal-style demo */}
					<div className="overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-gray-800">
						<div className="flex items-center gap-2 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
							<div className="flex gap-1.5">
								<div className="h-3 w-3 rounded-full bg-red-500 shadow-sm" />
								<div className="h-3 w-3 rounded-full bg-yellow-500 shadow-sm" />
								<div className="h-3 w-3 rounded-full bg-green-500 shadow-sm" />
							</div>
							<div className="ml-2 flex items-center gap-2 text-sm text-gray-400">
								<Terminal className="h-4 w-4" />
								<span>The Introduction - Smart Notes</span>
							</div>
						</div>

						<div className="p-6 font-mono text-sm">
							<div className="space-y-4">
								{/* User message */}
								<div>
									<span className="text-green-400">You:</span>
									<span className="ml-2 text-gray-300">
										Add Sarah to my network. She's 28, loves hiking and
										photography, works in tech.
									</span>
								</div>

								{/* AI response */}
								<div>
									<span className="text-sky-400">Assistant:</span>
									<span className="ml-2 text-gray-300">
										I've added Sarah to your network with the details you
										provided. Would you like me to suggest any potential matches
										from your existing connections?
									</span>
								</div>

								{/* User message */}
								<div>
									<span className="text-green-400">You:</span>
									<span className="ml-2 text-gray-300">
										Yes, who might be a good match?
									</span>
								</div>

								{/* AI suggestion */}
								<div>
									<span className="text-sky-400">Assistant:</span>
									<span className="ml-2 text-gray-300">
										Based on your notes, Alex (29, outdoor enthusiast, software
										engineer) shares similar interests with Sarah. They both
										enjoy hiking and work in tech. Would you like to make this
										introduction?
									</span>
								</div>

								{/* Cursor */}
								<div className="flex items-center">
									<span className="text-green-400">You:</span>
									<span className="ml-2 animate-pulse text-gray-300">▊</span>
								</div>
							</div>
						</div>
					</div>

					{/* How It Works */}
					<div className="mt-20">
						<h3 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
							How It Works
						</h3>
						<div className="mt-12 grid gap-10 sm:grid-cols-3">
							<div className="group text-center">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
									<span className="text-2xl font-bold">1</span>
								</div>
								<h4 className="mt-6 text-lg font-bold text-gray-900 dark:text-gray-100">
									Choose your platform
								</h4>
								<p className="mt-3 text-base text-gray-600 dark:text-gray-400">
									Claude, ChatGPT, or mobile app (coming soon)
								</p>
							</div>
							<div className="group text-center">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
									<span className="text-2xl font-bold">2</span>
								</div>
								<h4 className="mt-6 text-lg font-bold text-gray-900 dark:text-gray-100">
									Add people and details
								</h4>
								<p className="mt-3 text-base text-gray-600 dark:text-gray-400">
									Use natural conversation to keep track of friends and family
								</p>
							</div>
							<div className="group text-center">
								<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
									<span className="text-2xl font-bold">3</span>
								</div>
								<h4 className="mt-6 text-lg font-bold text-gray-900 dark:text-gray-100">
									Get smart suggestions
								</h4>
								<p className="mt-3 text-base text-gray-600 dark:text-gray-400">
									AI helps you make great matches - you make the final call
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
