import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Matchlight — Human matchmaking, powered by AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
	const interExtraBold = await fetch(
		"https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf",
	).then((res) => res.arrayBuffer());

	const dmSansLight = await fetch(
		"https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwA_JxhTg.ttf",
	).then((res) => res.arrayBuffer());

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#0f172a",
					position: "relative",
				}}
			>
				{/* Bokeh glow — top right (sky) */}
				<div
					style={{
						position: "absolute",
						width: "500px",
						height: "500px",
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(14,165,233,0.25) 0%, rgba(99,102,241,0.12) 35%, transparent 70%)",
						top: "-100px",
						right: "-50px",
					}}
				/>

				{/* Bokeh glow — bottom left (indigo/purple) */}
				<div
					style={{
						position: "absolute",
						width: "450px",
						height: "450px",
						borderRadius: "50%",
						background:
							"radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(168,85,247,0.10) 35%, transparent 70%)",
						bottom: "-80px",
						left: "-30px",
					}}
				/>

				{/* Center glow behind text */}
				<div
					style={{
						position: "absolute",
						width: "700px",
						height: "400px",
						borderRadius: "50%",
						background:
							"radial-gradient(ellipse, rgba(56,189,248,0.10) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					}}
				/>

				{/* Headline */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						fontFamily: "Inter",
						fontSize: 80,
						fontWeight: 800,
						letterSpacing: "-0.025em",
						lineHeight: 0.9,
						paddingLeft: 20,
						paddingRight: 20,
					}}
				>
					<span style={{ color: "#ffffff" }}>Meet your</span>
					<span style={{ color: "#38bdf8" }}>Matchmaker</span>
				</div>

				{/* Tagline */}
				<div
					style={{
						fontFamily: "DM Sans",
						fontSize: 28,
						fontWeight: 300,
						color: "#94a3b8",
						marginTop: 32,
						lineHeight: 1.625,
					}}
				>
					A real person finds your match, with AI behind the scenes
				</div>
			</div>
		),
		{
			...size,
			fonts: [
				{
					name: "Inter",
					data: interExtraBold,
					style: "normal",
					weight: 800,
				},
				{
					name: "DM Sans",
					data: dmSansLight,
					style: "normal",
					weight: 300,
				},
			],
		},
	);
}
