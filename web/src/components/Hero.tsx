"use client";

import { User, Sparkles, MessageSquare, Heart, Cloud, Check, Smartphone } from "lucide-react";

function ClaudeLogo({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M4.709 15.955l4.72-2.647.08-.08v-.16l-.08-.08-2.086-.601-1.682-.522-1.683-.521c-.24-.08-.4-.321-.4-.562 0-.32.24-.561.56-.561h.16l2.607.802 2.647.802h.08l.08-.08v-.16l-.08-.08-1.523-1.603-1.202-1.283-1.202-1.282c-.16-.16-.2-.4-.12-.601.12-.241.4-.361.641-.281l.16.08 2.166 1.763 2.086 1.723.08.04h.16l.04-.12v-.08l-.32-2.246-.281-1.883-.281-1.883c0-.08-.04-.16-.04-.24 0-.321.24-.562.56-.562.241 0 .481.16.522.4l.682 2.527.722 2.566v.08l.08.08h.16l.08-.08.722-2.566.681-2.526c.04-.241.281-.401.522-.401.32 0 .561.24.561.561 0 .08 0 .16-.04.24l-.28 1.884-.281 1.883-.321 2.246v.08l.04.12h.16l.08-.04 2.086-1.723 2.166-1.763.16-.08c.24-.08.521.04.641.28.08.201.04.441-.12.602l-1.202 1.282-1.202 1.283-1.523 1.603-.08.08v.16l.08.08h.08l2.647-.802 2.607-.802h.16c.32 0 .56.24.56.561 0 .24-.16.481-.4.561l-1.683.522-1.682.521-2.086.602-.08.08v.16l.08.08 4.72 2.647c.2.12.32.36.28.601-.04.32-.32.521-.64.521-.08 0-.16 0-.24-.04l-2.446-1.042-2.407-1.042h-.08l-.08.04-.04.12.04.12 1.162 2.246 1.122 2.246.04.16c.08.32-.08.601-.4.681-.08.04-.16.04-.2.04-.24 0-.441-.16-.521-.4l-1.003-2.407-.962-2.366-.04-.12-.12-.04h-.08l-.08.08-.321 4.96v.16c0 .28-.24.521-.521.521s-.521-.24-.521-.52v-.161l-.321-4.96-.08-.08h-.08l-.12.04-.04.12-.962 2.366-1.002 2.406c-.08.24-.281.401-.522.401-.04 0-.12 0-.2-.04-.321-.08-.481-.361-.401-.681l.04-.16 1.122-2.246 1.162-2.246.04-.12-.04-.12-.08-.04h-.08l-2.407 1.042-2.446 1.042c-.08.04-.16.04-.24.04-.32 0-.601-.2-.641-.52-.04-.241.08-.481.28-.602z" />
		</svg>
	);
}

function ChatGPTLogo({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
			<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
		</svg>
	);
}

import { Button } from "./ui";

export function Hero() {
	let scrollToSection = (id: string) => {
		let element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<section className="relative overflow-hidden bg-gray-50 py-24 dark:bg-gray-900 sm:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					{/* Main Headline */}
					<h1 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl lg:text-7xl">
						Intelligence, meet your
						<br />
						<span className="text-sky-600 dark:text-sky-400">Matchmaker</span>
					</h1>

					{/* Subheadline */}
					<p className="mt-8 font-display text-xl font-light leading-relaxed text-gray-600 dark:text-gray-400">
						Smart notes that help you connect people with confidence. Works with Claude, ChatGPT, or
						our mobile app.
					</p>

					{/* Platform availability */}
					<div className="mt-10 flex items-center justify-center gap-8 sm:gap-12">
						<div className="flex flex-col items-center gap-2">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D97757]/10">
								<ClaudeLogo className="h-7 w-7 text-[#D97757]" />
							</div>
							<span className="text-sm text-gray-500 dark:text-gray-400">Claude</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10A37F]/10">
								<ChatGPTLogo className="h-7 w-7 text-[#10A37F]" />
							</div>
							<span className="text-sm text-gray-500 dark:text-gray-400">ChatGPT</span>
						</div>
						<div className="flex flex-col items-center gap-2">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
								<Smartphone className="h-7 w-7 text-sky-500" />
							</div>
							<span className="text-sm text-gray-500 dark:text-gray-400">Mobile</span>
						</div>
					</div>

					{/* CTAs */}
					<div className="mt-12 flex items-center justify-center gap-x-6">
						<Button onClick={() => scrollToSection("waitlist")} size="lg" variant="primary">
							Join the Waitlist
						</Button>
					</div>
				</div>

				{/* Chat Demo */}
				<div className="mx-auto mt-20 max-w-5xl">
					<div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
						{/* Header */}
						<div className="border-b border-gray-200 bg-gradient-to-r from-sky-50 to-indigo-50 px-6 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
							<div className="flex items-center gap-3">
								<div className="rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 p-2 shadow-lg">
									<Check className="h-5 w-5 text-white" />
								</div>
								<div>
									<h2 className="font-semibold text-gray-900 dark:text-gray-100">Matchmaker</h2>
									<p className="text-xs text-gray-500 dark:text-gray-400">by The Introduction</p>
								</div>
							</div>
						</div>

						{/* Chat messages */}
						<div className="space-y-6 bg-gray-50 p-6 dark:bg-gray-900/50 sm:p-8">
							{/* User message 1 */}
							<div className="space-y-2">
								<div className="flex items-center justify-end gap-2 text-xs font-medium text-sky-600 dark:text-sky-400">
									<MessageSquare className="h-3.5 w-3.5" />
									<span>Natural language input</span>
								</div>
								<div className="flex items-start justify-end gap-3">
									<div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-sky-500 to-sky-600 px-4 py-3 shadow-md sm:max-w-[75%]">
										<p className="text-sm leading-relaxed text-white sm:text-base">
											Add Sarah to my network. She's 28, loves hiking and photography, works in
											tech.
										</p>
									</div>
									<div className="flex-shrink-0">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50">
											<User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
										</div>
									</div>
								</div>
							</div>

							{/* AI response 1 */}
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
									<Cloud className="h-3.5 w-3.5" />
									<span>AI understands context</span>
								</div>
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
											<Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
										</div>
									</div>
									<div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-md dark:bg-gray-800 sm:max-w-[75%]">
										<p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 sm:text-base">
											I've added Sarah to your network with the details you provided. Would you like
											me to suggest any potential matches from your existing connections?
										</p>
									</div>
								</div>
							</div>

							{/* User message 2 */}
							<div className="flex items-start justify-end gap-3">
								<div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-sky-500 to-sky-600 px-4 py-3 shadow-md sm:max-w-[75%]">
									<p className="text-sm leading-relaxed text-white sm:text-base">
										Yes, who might be a good match?
									</p>
								</div>
								<div className="flex-shrink-0">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50">
										<User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
									</div>
								</div>
							</div>

							{/* AI suggestion */}
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400">
									<Heart className="h-3.5 w-3.5" />
									<span>Smart matching</span>
								</div>
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
											<Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
										</div>
									</div>
									<div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-md dark:bg-gray-800 sm:max-w-[75%]">
										<p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 sm:text-base">
											Based on your notes, Alex (29, outdoor enthusiast, software engineer) shares
											similar interests with Sarah. They both enjoy hiking and work in tech. Would
											you like to make this introduction?
										</p>
									</div>
								</div>
							</div>

							{/* Typing indicator */}
							<div className="flex justify-end gap-3">
								<div className="flex items-center space-x-1 rounded-2xl rounded-tr-sm bg-white px-4 py-3 shadow-md dark:bg-gray-800">
									<div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
									<div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
									<div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
								</div>
								<div className="flex-shrink-0">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50">
										<User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Decorative background elements */}
			<div
				className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
				aria-hidden="true"
			>
				<div
					className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-sky-400 to-indigo-400 opacity-20 dark:opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>
			<div
				className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
				aria-hidden="true"
			>
				<div
					className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-400 to-sky-200 opacity-20 dark:opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>

			{/* Bokeh burst effects */}
			<div
				className="pointer-events-none absolute right-10 top-20 h-[400px] w-[400px] opacity-[0.2] blur-3xl sm:h-[500px] sm:w-[500px] sm:opacity-[0.25]"
				style={{
					background:
						"radial-gradient(circle, rgba(14, 165, 233, 0.5) 0%, rgba(99, 102, 241, 0.3) 25%, rgba(168, 85, 247, 0.15) 40%, transparent 65%)",
					animation: "bokehFloat 20s ease-in-out infinite",
				}}
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute left-20 top-1/3 h-[350px] w-[350px] opacity-[0.18] blur-3xl sm:h-[400px] sm:w-[400px] sm:opacity-[0.23]"
				style={{
					background:
						"radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, rgba(14, 165, 233, 0.3) 25%, rgba(168, 85, 247, 0.15) 40%, transparent 65%)",
					animation: "bokehFloatSlow 25s ease-in-out infinite",
					animationDelay: "5s",
				}}
				aria-hidden="true"
			/>
			<div
				className="pointer-events-none absolute bottom-32 right-1/3 h-[250px] w-[250px] opacity-[0.19] blur-3xl sm:h-[280px] sm:w-[280px] sm:opacity-[0.24]"
				style={{
					background:
						"radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, rgba(99, 102, 241, 0.3) 25%, rgba(14, 165, 233, 0.15) 40%, transparent 65%)",
					animation: "bokehFloat 18s ease-in-out infinite",
					animationDelay: "2s",
				}}
				aria-hidden="true"
			/>
		</section>
	);
}
