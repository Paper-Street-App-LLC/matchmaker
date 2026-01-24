"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

type ConnectionStatus = "checking" | "connected" | "disconnected";

function ConnectionIndicator({
	status,
	onRetry,
}: {
	status: ConnectionStatus;
	onRetry: () => void;
}) {
	return (
		<div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
			<div
				className={cn(
					"h-3 w-3 rounded-full",
					status === "checking" && "animate-pulse bg-amber-500",
					status === "connected" && "bg-green-500",
					status === "disconnected" && "bg-red-500"
				)}
				aria-hidden="true"
			/>
			<div className="flex-1">
				<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
					{status === "checking" && "Checking connection..."}
					{status === "connected" && "MCP server is reachable"}
					{status === "disconnected" && "Unable to reach MCP server"}
				</p>
				{status === "disconnected" && (
					<p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
						The server may be starting up or unavailable
					</p>
				)}
			</div>
			{status === "disconnected" && (
				<button
					onClick={onRetry}
					className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				>
					Retry
				</button>
			)}
		</div>
	);
}

function CopyIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
			/>
		</svg>
	);
}

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
		</svg>
	);
}

export default function SetupPage() {
	let [copied, setCopied] = useState(false);
	let [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");

	let mcpEndpoint = "https://matchmaker-production.up.railway.app/mcp";

	let healthEndpoint =
		typeof window !== "undefined"
			? `${window.location.protocol}//${window.location.host}/health`
			: "https://your-server-url.com/health";

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
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback for browsers that don't support clipboard API
			let textArea = document.createElement("textarea");
			textArea.value = mcpEndpoint;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}

	return (
		<main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
			<div className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12">
				<div className="w-full max-w-2xl">
					<Card variant="elevated">
						<CardHeader className="text-center">
							<div className="mb-4 inline-flex items-center justify-center rounded-full bg-sky-100 p-3 dark:bg-sky-900/30">
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
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							</div>
							<CardTitle as="h1" className="text-3xl">
								MCP Setup
							</CardTitle>
							<CardDescription className="mt-2 text-base">
								Connect your AI assistant to Matchmaker using the Model Context Protocol (MCP).
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-8">
							{/* What is MCP */}
							<section>
								<h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
									What is MCP?
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
									The Model Context Protocol (MCP) allows AI assistants like Claude to securely
									connect to external tools and services. By setting up MCP, your AI assistant can
									help you manage your matchmaking notes and suggestions.
								</p>
							</section>

							{/* MCP Endpoint URL */}
							<section>
								<h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
									MCP Endpoint URL
								</h2>
								<div className="flex items-center gap-2">
									<code className="flex-1 rounded-md border border-gray-200 bg-gray-100 px-4 py-3 font-mono text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
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
										aria-label={copied ? "Copied!" : "Copy MCP endpoint URL"}
									>
										{copied ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
									</button>
								</div>
								{copied && (
									<p className="mt-2 text-sm text-green-600 dark:text-green-400">
										Copied to clipboard!
									</p>
								)}
							</section>

							{/* Connection Status */}
							<section>
								<h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
									Connection Status
								</h2>
								<ConnectionIndicator status={connectionStatus} onRetry={checkConnection} />
							</section>

							{/* Setup Instructions */}
							<section>
								<h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
									Claude.ai Connection Instructions
								</h2>
								<ol className="space-y-4">
									<li className="flex gap-4">
										<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
											1
										</span>
										<div>
											<p className="font-medium text-gray-900 dark:text-gray-100">
												Open Claude.ai Settings
											</p>
											<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
												Go to{" "}
												<a
													href="https://claude.ai"
													target="_blank"
													rel="noopener noreferrer"
													className="text-sky-600 underline hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
												>
													claude.ai
												</a>{" "}
												and click on your profile icon, then select "Settings"
											</p>
										</div>
									</li>
									<li className="flex gap-4">
										<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
											2
										</span>
										<div>
											<p className="font-medium text-gray-900 dark:text-gray-100">
												Navigate to Integrations
											</p>
											<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
												In the settings menu, find the "Integrations" or "MCP Servers" section
											</p>
										</div>
									</li>
									<li className="flex gap-4">
										<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
											3
										</span>
										<div>
											<p className="font-medium text-gray-900 dark:text-gray-100">
												Add a new MCP server
											</p>
											<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
												Click "Add Integration" or "Add MCP Server" and enter a name like "The
												Introduction"
											</p>
										</div>
									</li>
									<li className="flex gap-4">
										<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
											4
										</span>
										<div>
											<p className="font-medium text-gray-900 dark:text-gray-100">
												Paste the MCP endpoint URL
											</p>
											<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
												Copy the URL above and paste it into the server URL field
											</p>
										</div>
									</li>
									<li className="flex gap-4">
										<span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
											5
										</span>
										<div>
											<p className="font-medium text-gray-900 dark:text-gray-100">
												Save and connect
											</p>
											<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
												Save your settings. Claude will attempt to connect to the MCP server
											</p>
										</div>
									</li>
								</ol>
							</section>

							{/* OAuth Authentication Flow */}
							<section>
								<h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
									OAuth Authentication Flow
								</h2>
								<p className="mb-4 text-gray-600 dark:text-gray-400">
									When connecting for the first time, you'll be guided through a secure OAuth
									authentication process:
								</p>
								<ol className="space-y-3">
									<li className="flex gap-3">
										<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
											1
										</span>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											<strong className="text-gray-900 dark:text-gray-100">
												Authorization redirect:
											</strong>{" "}
											Claude will redirect you to our login page
										</p>
									</li>
									<li className="flex gap-3">
										<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
											2
										</span>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											<strong className="text-gray-900 dark:text-gray-100">Sign in:</strong> Log in
											with your existing account or create a new one
										</p>
									</li>
									<li className="flex gap-3">
										<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
											3
										</span>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											<strong className="text-gray-900 dark:text-gray-100">
												Grant permission:
											</strong>{" "}
											Review and approve the permissions Claude needs to access your data
										</p>
									</li>
									<li className="flex gap-3">
										<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
											4
										</span>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											<strong className="text-gray-900 dark:text-gray-100">
												Connection complete:
											</strong>{" "}
											You'll be redirected back to Claude with access granted
										</p>
									</li>
								</ol>
								<p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
									Your access token is securely stored and will be used for all future requests. You
									can revoke access at any time from your account settings.
								</p>
							</section>

							{/* Troubleshooting */}
							<section>
								<h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
									Troubleshooting
								</h2>
								<div className="space-y-4">
									<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
										<h3 className="font-medium text-gray-900 dark:text-gray-100">
											Connection failed or timed out
										</h3>
										<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
											<li>Verify the MCP endpoint URL is correct and includes "/mcp"</li>
											<li>Check that you have a stable internet connection</li>
											<li>Try refreshing the page and reconnecting</li>
										</ul>
									</div>
									<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
										<h3 className="font-medium text-gray-900 dark:text-gray-100">
											Authentication errors
										</h3>
										<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
											<li>Ensure you're logged in to your account</li>
											<li>Check that your account has MCP access enabled</li>
											<li>Try disconnecting and reconnecting the integration</li>
											<li>Clear your browser cookies and try again</li>
										</ul>
									</div>
									<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
										<h3 className="font-medium text-gray-900 dark:text-gray-100">
											Tools not appearing in Claude
										</h3>
										<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
											<li>Verify the MCP server shows as "Connected" in settings</li>
											<li>Start a new conversation after connecting</li>
											<li>Check that you granted all required permissions during OAuth</li>
										</ul>
									</div>
									<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
										<h3 className="font-medium text-gray-900 dark:text-gray-100">
											Permission denied errors
										</h3>
										<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
											<li>Your account may not have the required "mcp:access" scope</li>
											<li>Contact support to enable MCP access for your account</li>
											<li>Re-authenticate to refresh your access token</li>
										</ul>
									</div>
								</div>
							</section>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	);
}
