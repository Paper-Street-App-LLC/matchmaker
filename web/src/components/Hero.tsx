"use client";

import { Button } from "./ui";

export function Hero() {
	let scrollToSection = (id: string) => {
		let element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<section className="relative overflow-hidden bg-white py-24 sm:py-32 lg:py-40 dark:bg-gray-950">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					{/* Brand Logo/Name */}
					<div className="mb-10">
						<h1 className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl dark:from-sky-400 dark:to-indigo-400">
							The Introduction
						</h1>
					</div>

					{/* Main Headline */}
					<h2 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl dark:text-gray-100">
						Your matchmaking,{" "}
						<span className="text-sky-600 dark:text-sky-400">supercharged</span>
					</h2>

					{/* Subheadline */}
					<p className="mt-8 text-xl leading-relaxed text-gray-600 dark:text-gray-400">
						AI-powered smart notes that help you connect friends and family with
						confidence. Work in Claude, ChatGPT, or our mobile app.
					</p>

					{/* CTAs */}
					<div className="mt-12 flex items-center justify-center gap-x-6">
						<Button
							onClick={() => scrollToSection("waitlist")}
							size="lg"
							variant="primary"
						>
							Join the Waitlist
						</Button>
					</div>
				</div>
			</div>

			{/* Decorative background elements */}
			<div
				className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
				aria-hidden="true"
			>
				<div
					className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-sky-400 to-indigo-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] dark:opacity-10"
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
					className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-400 to-sky-200 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] dark:opacity-10"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>
		</section>
	);
}
