"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Philosophy } from "@/components/Philosophy";
import { HowItWorks } from "@/components/HowItWorks";
import { FAQ } from "@/components/FAQ";
import { WaitlistForm } from "@/components/WaitlistForm";
import { ReferralForm } from "@/components/ReferralForm";
import { Card } from "@/components/ui";

export default function Home() {
	let [activeForm, setActiveForm] = useState<"matchmaker" | "single">("matchmaker");

	return (
		<main className="flex min-h-screen flex-col">
			{/* Hero Section */}
			<Hero />

			{/* Problem Section */}
			<Problem />

			{/* Philosophy Section */}
			<Philosophy />

			{/* How It Works Section */}
			<HowItWorks />

			{/* Waitlist Section */}
			<section className="relative overflow-hidden bg-gray-50 py-24 dark:bg-gray-900 sm:py-32">
				<div className="container mx-auto px-4">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
							Get started
						</h2>
						<p className="mt-6 font-display text-lg font-light text-gray-600 dark:text-gray-400">
							Join the Matchmaker waitlist for early access.
						</p>
					</div>
					<div className="mx-auto mt-12 max-w-md" id="waitlist">
						<Card variant="elevated" className="!pt-2">
							<div className="px-8 pb-10 pt-3">
								{/* Segmented control */}
								<div className="mb-8 flex justify-center">
									<div className="flex rounded-lg bg-gray-200 p-1 dark:bg-gray-700" role="tablist">
										<button
											role="tab"
											aria-selected={activeForm === "matchmaker"}
											onClick={() => setActiveForm("matchmaker")}
											className={`rounded-md px-5 py-2 text-sm font-medium transition-all ${
												activeForm === "matchmaker"
													? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100"
													: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
											}`}
										>
											I&apos;m a Matchmaker
										</button>
										<button
											role="tab"
											aria-selected={activeForm === "single"}
											onClick={() => setActiveForm("single")}
											className={`rounded-md px-5 py-2 text-sm font-medium transition-all ${
												activeForm === "single"
													? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100"
													: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
											}`}
										>
											I&apos;m looking for love
										</button>
									</div>
								</div>

								{activeForm === "matchmaker" ? (
									<>
										<div className="text-center">
											<div className="mb-6 inline-flex items-center justify-center rounded-full bg-sky-100 p-3 dark:bg-sky-900/30">
												<svg
													className="h-8 w-8 text-sky-600 dark:text-sky-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
													/>
												</svg>
											</div>
											<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
												Claim Your Spot
											</h2>
											<p className="mt-3 font-display font-normal text-gray-600 dark:text-gray-400">
												For the people who always know who should meet who.
											</p>
										</div>
										<div className="mt-8">
											<WaitlistForm />
										</div>
									</>
								) : (
									<>
										<div className="text-center">
											<div className="mb-6 inline-flex items-center justify-center rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/30">
												<svg
													className="h-8 w-8 text-indigo-600 dark:text-indigo-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
													/>
												</svg>
											</div>
											<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
												Find Your Matchmaker
											</h2>
											<p className="mt-3 font-display font-normal text-gray-600 dark:text-gray-400">
												Ready to be matched? We&apos;ll connect you with someone who can
												help.
											</p>
										</div>
										<div className="mt-8">
											<ReferralForm />
										</div>
									</>
								)}
							</div>
						</Card>
					</div>
				</div>

				{/* Decorative background */}
				<div
					className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
					aria-hidden="true"
				>
					<div
						className="relative left-[calc(50%)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-sky-300 to-purple-300 opacity-20 dark:opacity-10"
						style={{
							clipPath:
								"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
						}}
					/>
				</div>
			</section>

			{/* FAQ Section */}
			<FAQ />

			{/* Footer */}
			<footer className="border-t border-gray-200 bg-gray-100 py-20 dark:border-gray-800 dark:bg-gray-900/95">
				<div className="container mx-auto px-4">
					<div className="flex flex-col items-center space-y-8">
						<div className="text-center">
							<h3 className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent dark:from-sky-400 dark:to-indigo-400">
								Matchmaker
							</h3>
							<p className="mt-3 font-display text-lg font-normal text-gray-600 dark:text-gray-400">
								Human matchmaking, powered by AI.
							</p>
						</div>
						<div className="flex space-x-8 text-sm font-medium text-gray-500 dark:text-gray-400">
							<a
								href="#"
								className="relative transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-sky-600 after:transition-all hover:text-sky-600 hover:after:w-full dark:after:bg-sky-400 dark:hover:text-sky-400"
							>
								Privacy Policy
							</a>
							<a
								href="#"
								className="relative transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-sky-600 after:transition-all hover:text-sky-600 hover:after:w-full dark:after:bg-sky-400 dark:hover:text-sky-400"
							>
								Terms
							</a>
						</div>
						<p className="text-sm text-gray-400 dark:text-gray-500">
							© {new Date().getFullYear()} Matchmaker. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</main>
	);
}
