import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	weight: ["300", "400", "500"],
	variable: "--font-dm-sans",
});

export const metadata: Metadata = {
	title: "The Introduction | Smart Notes for Matchmakers",
	description:
		"AI-assisted matchmaking tool that empowers you to connect friends and family. Works in Claude, ChatGPT, or mobile app. You're in control - AI assists, you decide.",
	keywords: [
		"matchmaking",
		"AI-assisted matchmaking",
		"smart notes",
		"MCP",
		"connect friends",
		"The Introduction",
	],
	openGraph: {
		title: "The Introduction | Smart Notes for Matchmakers",
		description:
			"AI-assisted matchmaking tool that empowers you to connect friends and family. Works in Claude, ChatGPT, or mobile app.",
		type: "website",
		siteName: "The Introduction",
	},
	twitter: {
		card: "summary_large_image",
		title: "The Introduction | Smart Notes for Matchmakers",
		description: "AI-assisted matchmaking tool that empowers you to connect friends and family.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${dmSans.variable} font-sans`}>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
