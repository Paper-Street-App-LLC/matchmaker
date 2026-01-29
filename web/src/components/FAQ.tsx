"use client";

import { useState } from "react";

interface FAQItem {
	question: string;
	answer: string;
}

let faqs: FAQItem[] = [
	{
		question: "What is Matchlight?",
		answer:
			"A matchmaking experience where a real person finds your match, with AI doing the heavy lifting behind the scenes.",
	},
	{
		question: "How is this different from apps?",
		answer:
			"Apps hand you a list of strangers and ask you to swipe. Matchlight gives you a matchmaker who knows both people and only introduces you when there's a real reason to.",
	},
	{
		question: "What does the AI do?",
		answer:
			"It reads matchmaker notes, spots compatibility patterns, and surfaces potential matches. It never reaches out to anyone or makes introductions on its own.",
	},
	{
		question: "Who is Matchlight for?",
		answer:
			"Singles who want a more personal way to find their person, and matchmakers who love connecting people and want better tools to do it.",
	},
	{
		question: "Is my information safe?",
		answer:
			"All data is encrypted with row-level security. Nothing is shared with third parties. You control your data completely.",
	},
	{
		question: "What's the connection to The Introduction?",
		answer:
			"Matchlight was built by The Introduction to power our own matchmaking. Now we're opening it up to more matchmakers and more singles.",
	},
	{
		question: "When does it launch?",
		answer: "Soon. Join the waitlist and we'll let you know.",
	},
];

export function FAQ() {
	let [openIndex, setOpenIndex] = useState<number | null>(null);

	let toggleQuestion = (index: number) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	return (
		<section className="relative overflow-hidden bg-gray-100 py-24 dark:bg-gray-900/95 sm:py-32">
			<div className="container mx-auto px-4">
				<div className="mx-auto max-w-3xl">
					{/* Header */}
					<div className="text-center">
						<h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
							Frequently Asked{" "}
							<span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-indigo-400">
								Questions
							</span>
						</h2>
						<p className="mt-6 font-display text-lg font-light text-gray-600 dark:text-gray-400">
							Everything you need to know about Matchlight
						</p>
					</div>

					{/* FAQ Items */}
					<div className="mt-16 space-y-4">
						{faqs.map((faq, index) => (
							<div
								key={index}
								className="group rounded-2xl border border-gray-200 bg-white transition-all hover:border-sky-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-sky-700"
							>
								<button
									onClick={() => toggleQuestion(index)}
									className="flex w-full items-start justify-between gap-4 p-6 text-left transition-all"
									aria-expanded={openIndex === index}
								>
									<div className="flex items-start gap-4">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white transition-transform group-hover:scale-110">
											{index + 1}
										</div>
										<h3 className="self-center text-lg font-bold text-gray-900 dark:text-gray-100">
											{faq.question}
										</h3>
									</div>
									<svg
										className={`mt-1 h-6 w-6 shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${
											openIndex === index ? "rotate-180" : ""
										}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
								<div
									className={`overflow-hidden transition-all duration-300 ${
										openIndex === index ? "max-h-96" : "max-h-0"
									}`}
								>
									<div className="px-6 pb-6 pl-[4.5rem]">
										<p className="font-display font-normal text-gray-600 dark:text-gray-400">
											{faq.answer}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Decorative background */}
			<div
				className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
				aria-hidden="true"
			>
				<div
					className="relative left-[calc(50%-10rem)] aspect-[1155/678] w-[36.125rem] rotate-[30deg] bg-gradient-to-tr from-indigo-300 to-purple-300 opacity-20 dark:opacity-10"
					style={{
						clipPath:
							"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
					}}
				/>
			</div>
		</section>
	);
}
