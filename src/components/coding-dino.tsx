import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

function injectKeyframes() {
	if (Platform.OS !== "web" || typeof document === "undefined") return;
	const id = "dino-coding-keyframes";
	if (document.getElementById(id)) return;
	const style = document.createElement("style");
	style.id = id;
	style.textContent = [
		"@keyframes ff-cod-type{0%,100%{transform:translateY(0)}20%{transform:translateY(-2.5px)}60%{transform:translateY(-1px)}}",
		"@keyframes ff-cod-blink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.08)}}",
		"@keyframes ff-cod-glow{0%,100%{opacity:0.75}50%{opacity:1}}",
		"@keyframes ff-cod-cursor{0%,100%{opacity:1}50%{opacity:0}}",
		"@keyframes ff-cod-breathe{0%,100%{transform:scaleX(1) scaleY(1)}50%{transform:scaleX(1.03) scaleY(0.97)}}",
		"@keyframes ff-cod-tail{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}",
	].join("");
	document.head.appendChild(style);
}

function anim(css: string, origin?: string): Record<string, unknown> {
	if (Platform.OS !== "web") return {};
	const s: Record<string, unknown> = { animation: css };
	if (origin) s.transformOrigin = origin;
	return s;
}

export function CodingDino({ dark }: { dark: boolean }) {
	useEffect(() => injectKeyframes(), []);
	const body = dark ? "#4ade80" : "#22c55e";
	const bodyDark = dark ? "#22c55e" : "#16a34a";
	const belly = dark ? "#bbf7d0" : "#86efac";
	const eye = dark ? "#052e16" : "#14532d";
	const cheek = dark ? "rgba(251,191,36,0.25)" : "rgba(251,191,36,0.3)";
	const laptopFrame = dark ? "#374151" : "#4b5563";
	const laptopLight = dark ? "#6b7280" : "#9ca3af";
	const screen = dark ? "#0f172a" : "#0f172a";
	const screenGlow = dark ? "#38bdf8" : "#0ea5e9";
	const screenGlowBg = dark ? "rgba(56,189,248,0.12)" : "rgba(14,165,233,0.1)";

	return (
		<View style={{ width: 160, height: 120 }}>
			<Svg viewBox="0 0 160 120" width={160} height={120} fill="none">

				{/* Screen glow aura */}
				<G style={anim("ff-cod-glow 2.5s ease-in-out infinite")}>
					<Rect x={62} y={18} width={46} height={42} rx={5} fill={screenGlowBg} />
				</G>

				{/* Laptop screen frame */}
				<Rect x={66} y={22} width={38} height={36} rx={3} fill={laptopFrame} />

				{/* Screen content */}
				<G style={anim("ff-cod-glow 2.5s ease-in-out infinite")}>
					<Rect x={68} y={24} width={34} height={32} rx={2} fill={screen} />
					{/* Code lines */}
					<Line x1={71} y1={30} x2={88} y2={30} stroke={screenGlow} strokeWidth={1.5} strokeLinecap="round" opacity={0.9} />
					<Line x1={71} y1={34} x2={95} y2={34} stroke={screenGlow} strokeWidth={1.5} strokeLinecap="round" opacity={0.65} />
					<Line x1={71} y1={38} x2={91} y2={38} stroke={screenGlow} strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
					<Line x1={71} y1={42} x2={85} y2={42} stroke={screenGlow} strokeWidth={1.5} strokeLinecap="round" opacity={0.55} />
					<Line x1={71} y1={46} x2={93} y2={46} stroke={screenGlow} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
					{/* Blinking cursor */}
					<G style={anim("ff-cod-cursor 1.1s step-end infinite")}>
						<Rect x={86} y={46} width={2} height={6} rx={0.5} fill={screenGlow} />
					</G>
				</G>

				{/* Laptop keyboard base */}
				<Rect x={64} y={57} width={42} height={9} rx={3} fill={laptopFrame} />
				<Rect x={66} y={59} width={38} height={5} rx={2} fill={laptopLight} opacity={0.25} />
				{/* Trackpad */}
				<Rect x={78} y={60} width={14} height={3.5} rx={1.5} fill={laptopLight} opacity={0.4} />

				{/* Dino body */}
				<G style={anim("ff-cod-breathe 3.5s ease-in-out infinite", "94px 72px")}>

					{/* Tail */}
					<G style={anim("ff-cod-tail 2s ease-in-out infinite", "80px 74px")}>
						<Path d="M80 74 Q66 66 60 54 Q57 46 60 44 Q64 46 66 52 Q72 62 78 68" fill={body} />
						<Circle cx={60} cy={45} r={2} fill={bodyDark} />
						<Circle cx={64} cy={48} r={1.5} fill={bodyDark} />
					</G>

					{/* Body */}
					<Ellipse cx={96} cy={74} rx={22} ry={16} fill={body} />
					<Ellipse cx={98} cy={78} rx={14} ry={10} fill={belly} />

					{/* Legs — seated, tucked */}
					<Path d="M86 86 Q82 92 80 96" stroke={body} strokeWidth={5.5} strokeLinecap="round" fill="none" />
					<Ellipse cx={80} cy={97} rx={6} ry={2.5} fill={bodyDark} />
					<Path d="M104 86 Q108 92 110 96" stroke={body} strokeWidth={5.5} strokeLinecap="round" fill="none" />
					<Ellipse cx={110} cy={97} rx={6} ry={2.5} fill={bodyDark} />

					{/* Arms — reaching to keyboard */}
					<G style={anim("ff-cod-type 0.3s ease-in-out infinite", "84px 70px")}>
						<Path d="M84 70 Q78 62 74 58" stroke={body} strokeWidth={4} strokeLinecap="round" fill="none" />
						<Circle cx={74} cy={57} r={3} fill={body} />
						<Circle cx={72} cy={56} r={1.5} fill={bodyDark} />
						<Circle cx={75} cy={59} r={1.5} fill={bodyDark} />
					</G>
					<G style={anim("ff-cod-type 0.3s ease-in-out 0.15s infinite", "106px 70px")}>
						<Path d="M106 70 Q104 62 100 58" stroke={body} strokeWidth={4} strokeLinecap="round" fill="none" />
						<Circle cx={100} cy={57} r={3} fill={body} />
						<Circle cx={98} cy={56} r={1.5} fill={bodyDark} />
						<Circle cx={101} cy={59} r={1.5} fill={bodyDark} />
					</G>

					{/* Head — slightly bowed, looking at screen */}
					<G transform="rotate(10 96 48)">
						<Ellipse cx={96} cy={48} rx={15} ry={13} fill={body} />
						<Path d="M84 37 L86 32 L89 37" fill={bodyDark} />
						<Path d="M89 35 L92 29 L95 35" fill={bodyDark} />
						<Path d="M94 35 L97 30 L99 36" fill={bodyDark} />

						{/* Snout */}
						<Ellipse cx={106} cy={51} rx={9} ry={7} fill={body} />
						<Ellipse cx={107} cy={52} rx={6} ry={5} fill={belly} />
						<Circle cx={111} cy={49} r={1.2} fill={eye} opacity={0.4} />
						<Circle cx={111} cy={52} r={1} fill={eye} opacity={0.3} />
						<Ellipse cx={102} cy={54} rx={3} ry={2} fill={cheek} />

						{/* Focused/squinting eye */}
						<G style={anim("ff-cod-blink 4s ease-in-out infinite", "97px 45px")}>
							<Circle cx={97} cy={45} r={4.5} fill="white" />
							<Circle cx={99} cy={45} r={2.5} fill={eye} />
							<Circle cx={100} cy={44} r={0.9} fill="white" />
						</G>

						{/* Tiny focused smile */}
						<Path d="M103 57 Q107 60 111 57" stroke={eye} strokeWidth={0.8} fill="none" strokeLinecap="round" />
					</G>
				</G>
			</Svg>
		</View>
	);
}
