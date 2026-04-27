"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

type ConnectionStatus = "checking" | "connected" | "disconnected";

function StatusPill({ status }: { status: ConnectionStatus }) {
	let label =
		status === "checking" ? "Checking" : status === "connected" ? "Live" : "Offline";
	let dotClass = cn(
		"h-2 w-2 rounded-full",
		status === "checking" && "animate-pulse bg-amber-500",
		status === "connected" && "animate-glow-pulse bg-green-500",
		status === "disconnected" && "bg-red-500"
	);
	let ringClass = cn(
		"inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
		status === "checking" &&
			"border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300",
		status === "connected" &&
			"border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300",
		status === "disconnected" &&
			"border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300"
	);
	let style =
		status === "connected"
			? ({ "--glow-color": "rgba(34,197,94,0.5)" } as React.CSSProperties)
			: undefined;

	return (
		<span className={ringClass}>
			<span className={dotClass} style={style} aria-hidden="true" />
			{label}
		</span>
	);
}

let steps: readonly { title: string; hint: string }[] = [
	{ title: "Open Claude.ai", hint: "Profile \u2192 Settings" },
	{ title: "Go to Integrations", hint: "Find \u201cMCP Servers\u201d" },
	{ title: "Add MCP server", hint: "Name it, paste the URL above, save" },
	{ title: "Complete OAuth sign-in", hint: "Expand for flow details" },
] as const;

let oauthSteps: readonly string[] = [
	"Claude redirects you to our login page.",
	"Sign in or create an account.",
	"Review and approve the requested permissions.",
	"Redirected back to Claude with access granted.",
] as const;

let troubleshooting: readonly {
	title: string;
	items: readonly string[];
}[] = [
	{
		title: "Connection failed or timed out",
		items: [
			"Verify the endpoint URL includes \u201c/mcp\u201d.",
			"Check your internet connection.",
			"Refresh the page and reconnect.",
		],
	},
	{
		title: "Authentication errors",
		items: [
			"Ensure you are signed in.",
			"Confirm your account has MCP access enabled.",
			"Disconnect and reconnect the integration.",
			"Clear browser cookies and retry.",
		],
	},
	{
		title: "Tools not appearing in Claude",
		items: [
			"Verify the server shows \u201cConnected\u201d in settings.",
			"Start a new conversation after connecting.",
			"Check that you granted all OAuth permissions.",
		],
	},
	{
		title: "Permission denied errors",
		items: [
			"Your account may lack the \u201cmcp:access\u201d scope.",
			"Contact support to enable MCP access.",
			"Re-authenticate to refresh your access token.",
		],
	},
] as const;

export default function SetupPage() {
	let [copied, setCopied] = useState(false);
	let [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");

	let mcpEndpoint = "https://matchmaker-production.up.railway.app/mcp";
	let healthEndpoint = new URL("/health", mcpEndpoint).toString();

	let checkConnection = useCallback(async () => {
		setConnectionStatus("checking");
		try {
			let response = await fetch(healthEndpoint, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (response.ok) {
				let data = await response.json();
				if (data.status === "healthy") {
					setConnectionStatus("connected");
					return;
				}
			}
			setConnectionStatus("disconnected");
		} catch {
			setConnectionStatus("disconnected");
		}
	}, [healthEndpoint]);

	useEffect(() => {
		checkConnection();
	}, [checkConnection]);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(mcpEndpoint);
		} catch {
			let textArea = document.createElement("textarea");
			textArea.value = mcpEndpoint;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
			<div className="container mx-auto flex flex-1 flex-col items-center px-4 py-12">
				<div className="w-full max-w-2xl">
					<Link
						href="/"
						className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to home
					</Link>
					<Card variant="elevated" className="overflow-hidden p-0">
						{/* Hero strip */}
						<div className="relative border-b border-gray-200 px-8 py-7 dark:border-gray-700">
							<div className="flex items-start justify-between gap-4">
								<div>
									<h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
										MCP Setup
									</h1>
									<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Connect Claude to Matchmaker.
									</p>
								</div>
								<StatusPill status={connectionStatus} />
							</div>
						</div>

						<CardContent className="space-y-8 px-8 py-7">
							{/* Endpoint */}
							<section>
								<div className="mb-2 flex items-center justify-between">
									<h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
										Endpoint
									</h2>
									{copied && (
										<span className="text-xs font-medium text-green-600 dark:text-green-400">
											Copied
										</span>
									)}
								</div>
								<div className="flex items-stretch gap-2">
									<code className="flex-1 truncate rounded-md border border-gray-200 bg-gray-100 px-4 py-3 font-mono text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
										{mcpEndpoint}
									</code>
									<button
										onClick={handleCopy}
										className={cn(
											"inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border transition-all duration-200",
											copied
												? "border-green-500 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
												: "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-sky-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-sky-400"
										)}
										aria-label={copied ? "Copied" : "Copy endpoint"}
									>
										{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
									</button>
									<button
										onClick={checkConnection}
										disabled={connectionStatus === "checking"}
										className="inline-flex h-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-sky-600 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-sky-400"
										aria-label="Test connection"
									>
										<RefreshCw
											className={cn(
												"h-4 w-4",
												connectionStatus === "checking" && "animate-spin"
											)}
										/>
										Test
									</button>
								</div>
							</section>

							{/* Stepper */}
							<section>
								<h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
									Setup
								</h2>
								<ol className="space-y-2">
									{steps.map((step, i) => {
										let isLast = i === steps.length - 1;
										let row = (
											<div className="flex items-center gap-3">
												<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
													{i + 1}
												</span>
												<div className="flex-1">
													<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
														{step.title}
													</p>
													<p className="text-xs text-gray-500 dark:text-gray-400">
														{step.hint}
													</p>
												</div>
												{i === 0 && (
													<a
														href="https://claude.ai"
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
													>
														claude.ai
														<ExternalLink className="h-3 w-3" />
													</a>
												)}
												{isLast && (
													<ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
												)}
											</div>
										);

										if (isLast) {
											return (
												<li key={step.title}>
													<details className="group rounded-md border border-transparent transition-colors open:border-gray-200 open:bg-gray-50 dark:open:border-gray-700 dark:open:bg-gray-800/50">
														<summary className="cursor-pointer list-none p-2">
															{row}
														</summary>
														<ol className="ml-10 space-y-2 border-l border-amber-200 py-2 pl-4 dark:border-amber-900/40">
															{oauthSteps.map((text, j) => (
																<li
																	key={j}
																	className="relative text-xs text-gray-600 dark:text-gray-400"
																>
																	<span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-500" />
																	{text}
																</li>
															))}
														</ol>
													</details>
												</li>
											);
										}
										return (
											<li key={step.title} className="p-2">
												{row}
											</li>
										);
									})}
								</ol>
							</section>

							{/* Troubleshooting */}
							<section>
								<details className="group">
									<summary className="flex cursor-pointer list-none items-center justify-between rounded-md py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
										Troubleshooting
										<ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
									</summary>
									<div className="mt-2 space-y-1">
										{troubleshooting.map(issue => (
											<details
												key={issue.title}
												className="group/item rounded-md border border-gray-200 bg-gray-50 open:bg-white dark:border-gray-700 dark:bg-gray-800/50 dark:open:bg-gray-800"
											>
												<summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
													{issue.title}
													<ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open/item:rotate-90" />
												</summary>
												<ul className="list-inside list-disc space-y-1 px-4 pb-3 text-sm text-gray-600 dark:text-gray-400">
													{issue.items.map(item => (
														<li key={item}>{item}</li>
													))}
												</ul>
											</details>
										))}
									</div>
								</details>
							</section>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
