import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: "class",
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-inter)", "sans-serif"],
				display: ["var(--font-dm-sans)", "sans-serif"],
			},
			keyframes: {
				"glow-pulse": {
					"0%, 100%": { boxShadow: "0 0 8px 0 var(--glow-color)" },
					"50%": { boxShadow: "0 0 20px 4px var(--glow-color)" },
				},
			},
			animation: {
				"glow-pulse": "glow-pulse 4s ease-in-out infinite",
			},
			colors: {
				primary: {
					DEFAULT: "#0ea5e9",
					50: "#f0f9ff",
					100: "#e0f2fe",
					200: "#bae6fd",
					300: "#7dd3fc",
					400: "#38bdf8",
					500: "#0ea5e9",
					600: "#0284c7",
					700: "#0369a1",
					800: "#075985",
					900: "#0c4a6e",
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
};
export default config;
