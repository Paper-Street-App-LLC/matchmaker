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
	title: "Matchlight — Human matchmaking, powered by AI",
	description:
		"A new kind of matchmaking experience, where a real person finds your match, with AI doing the heavy lifting behind the scenes.",
	keywords: [
		"matchmaking",
		"AI-assisted matchmaking",
		"matchmaker",
		"dating",
		"human matchmaking",
		"Matchlight",
	],
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicons/favicon-16x16.png",
		apple: "/apple-touch-icon/apple-touch-icon-180x180.png",
	},
	openGraph: {
		title: "Matchlight — Human matchmaking, powered by AI",
		description:
			"A new kind of matchmaking experience, where a real person finds your match, with AI doing the heavy lifting behind the scenes.",
		type: "website",
		siteName: "Matchlight",
	},
	twitter: {
		card: "summary_large_image",
		title: "Matchlight — Human matchmaking, powered by AI",
		description:
			"A new kind of matchmaking experience, where a real person finds your match, with AI doing the heavy lifting behind the scenes.",
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
