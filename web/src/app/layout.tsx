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
	title: "Smart Notes for Matchmakers",
	description:
		"AI-assisted matchmaking tool that empowers you to connect friends and family. Works in Claude, ChatGPT, or mobile app. You're in control - AI assists, you decide.",
	keywords: [
		"matchmaking",
		"AI-assisted matchmaking",
		"smart notes",
		"MCP",
		"connect friends",
		"Matchmaker",
	],
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicons/favicon-16x16.png",
		apple: "/apple-touch-icon/apple-touch-icon-180x180.png",
	},
	openGraph: {
		title: "Smart Notes for Matchmakers",
		description:
			"AI-assisted matchmaking tool that empowers you to connect friends and family. Works in Claude, ChatGPT, or mobile app.",
		type: "website",
		siteName: "Matchmaker",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "Smart Notes for Matchmakers",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Smart Notes for Matchmakers",
		description: "AI-assisted matchmaking tool that empowers you to connect friends and family.",
		images: ["/og-image.png"],
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
