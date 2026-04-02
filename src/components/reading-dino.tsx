import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";

function injectKeyframes() {
	if (Platform.OS !== "web" || typeof document === "undefined") return;
	const id = "dino-reading-keyframes";
	if (document.getElementById(id)) return;
	const style = document.createElement("style");
	style.id = id;
	style.textContent = [
		"@keyframes ff-blink{0%,80%,100%{transform:scaleY(1)}85%{transform:scaleY(0.1)}}",
		"@keyframes ff-read{0%,100%{transform:rotate(-3deg) translateY(1px)}50%{transform:rotate(3deg) translateY(-1px)}}",
		"@keyframes ff-page{0%{transform:translateY(0) rotate(12deg);opacity:0.7}30%{transform:translateY(-14px) rotate(20deg);opacity:0.9}60%{transform:translateY(-6px) rotate(8deg);opacity:0.5}100%{transform:translateY(0) rotate(12deg);opacity:0.7}}",
		"@keyframes ff-tail{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}",
		"@keyframes ff-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}",
		"@keyframes ff-breathe{0%,100%{transform:scaleX(1) scaleY(1)}50%{transform:scaleX(1.03) scaleY(0.97)}}",
		"@keyframes ff-eyetrack{0%,100%{transform:translateX(0)}30%{transform:translateX(1.5px)}70%{transform:translateX(-0.5px)}}",
	].join("");
	document.head.appendChild(style);
}

// Web-only animation helper
function anim(css: string, origin?: string): Record<string, unknown> {
	if (Platform.OS !== "web") return {};
	const s: Record<string, unknown> = { animation: css };
	if (origin) s.transformOrigin = origin;
	return s;
}

export function ReadingDino({ dark }: { dark: boolean }) {
	useEffect(() => injectKeyframes(), []);

	const body = dark ? "#4ade80" : "#22c55e";
	const bodyDark = dark ? "#22c55e" : "#16a34a";
	const belly = dark ? "#bbf7d0" : "#86efac";
	const eye = dark ? "#052e16" : "#14532d";
	const page = dark ? "#e2e8f0" : "#ffffff";
	const pageLines = dark ? "#94a3b8" : "#cbd5e1";
	const cheek = dark ? "rgba(251,191,36,0.25)" : "rgba(251,191,36,0.3)";

	return (
		<View style={{ width: 140, height: 110 }}>
			<Svg viewBox="0 0 140 110" width={140} height={110} fill="none">
				<G style={anim("ff-bounce 2s ease-in-out infinite", "50px 60px")}>

					{/* Tail */}
					<G style={anim("ff-tail 0.8s ease-in-out infinite", "28px 60px")}>
						<Path d="M28 60 Q14 50 8 36 Q5 28 8 26 Q12 28 14 34 Q20 44 26 54" fill={body} />
						<Circle cx={8} cy={27} r={2.5} fill={bodyDark} />
						<Circle cx={12} cy={30} r={2} fill={bodyDark} />
					</G>

					{/* Body */}
					<G style={anim("ff-breathe 3s ease-in-out infinite", "48px 62px")}>
						<Ellipse cx={48} cy={62} rx={24} ry={20} fill={body} />
						<Ellipse cx={50} cy={66} rx={15} ry={12} fill={belly} />
					</G>

					{/* Feet */}
					<Ellipse cx={36} cy={80} rx={8} ry={3.5} fill={bodyDark} />
					<Ellipse cx={58} cy={80} rx={8} ry={3.5} fill={bodyDark} />
					<Circle cx={30} cy={79} r={1.5} fill={bodyDark} />
					<Circle cx={34} cy={78} r={1.5} fill={bodyDark} />
					<Circle cx={52} cy={78} r={1.5} fill={bodyDark} />
					<Circle cx={56} cy={79} r={1.5} fill={bodyDark} />

					{/* PDF document */}
					<G style={anim("ff-read 2.5s ease-in-out infinite", "86px 46px")}>
						<Rect x={74} y={26} width={30} height={40} rx={2.5} fill={pageLines} opacity={0.4} />
						<Rect x={72} y={24} width={30} height={40} rx={2.5} fill={pageLines} opacity={0.7} />
						<Rect x={70} y={22} width={30} height={40} rx={2.5} fill={page} stroke={pageLines} strokeWidth={1} />
						<Path d="M93 22 L100 22 L100 29 Z" fill={pageLines} opacity={0.3} />
						<Path d="M93 22 L93 29 L100 29" fill={page} stroke={pageLines} strokeWidth={0.5} />
						<Line x1={75} y1={30} x2={92} y2={30} stroke={pageLines} strokeWidth={1.2} />
						<Line x1={75} y1={34} x2={90} y2={34} stroke={pageLines} strokeWidth={1.2} />
						<Line x1={75} y1={38} x2={92} y2={38} stroke={pageLines} strokeWidth={1.2} />
						<Line x1={75} y1={42} x2={87} y2={42} stroke={pageLines} strokeWidth={1.2} />
						<Line x1={75} y1={46} x2={91} y2={46} stroke={pageLines} strokeWidth={1.2} />
						<Line x1={75} y1={50} x2={85} y2={50} stroke={pageLines} strokeWidth={1.2} />
						<Rect x={73} y={51} width={24} height={10} rx={2} fill="#dc2626" />
						<SvgText x={78} y={59} fontSize={8} fontWeight="bold" fill="white" fontFamily="system-ui">PDF</SvgText>
					</G>

					{/* Left arm */}
					<Path d="M62 52 Q67 42 72 34" stroke={body} strokeWidth={4} strokeLinecap="round" fill="none" />
					<Circle cx={72} cy={33} r={3} fill={body} />
					<Circle cx={70} cy={32} r={1.5} fill={bodyDark} />
					<Circle cx={71} cy={35} r={1.5} fill={bodyDark} />

					{/* Right arm */}
					<Path d="M64 58 Q72 52 78 46" stroke={body} strokeWidth={4} strokeLinecap="round" fill="none" />
					<Circle cx={78} cy={45} r={3} fill={body} />
					<Circle cx={77} cy={43} r={1.5} fill={bodyDark} />
					<Circle cx={79} cy={47} r={1.5} fill={bodyDark} />

					{/* Floating page */}
					<G style={anim("ff-page 3.5s ease-in-out infinite", "112px 16px")}>
						<Rect x={104} y={6} width={18} height={24} rx={2} fill={page} stroke={pageLines} strokeWidth={0.7} opacity={0.6} transform="rotate(15 113 18)" />
						<Line x1={108} y1={12} x2={118} y2={12} stroke={pageLines} strokeWidth={0.8} opacity={0.5} transform="rotate(15 113 18)" />
						<Line x1={108} y1={15} x2={116} y2={15} stroke={pageLines} strokeWidth={0.8} opacity={0.5} transform="rotate(15 113 18)" />
						<Line x1={108} y1={18} x2={117} y2={18} stroke={pageLines} strokeWidth={0.8} opacity={0.4} transform="rotate(15 113 18)" />
						<Rect x={109} y={22} width={10} height={4} rx={1} fill="#dc2626" opacity={0.4} transform="rotate(15 113 18)" />
					</G>

					{/* Second floating page */}
					<G style={anim("ff-page 4s ease-in-out 1s infinite", "122px 36px")}>
						<Rect x={116} y={28} width={14} height={18} rx={1.5} fill={page} stroke={pageLines} strokeWidth={0.5} opacity={0.35} transform="rotate(-10 123 37)" />
						<Line x1={119} y1={33} x2={127} y2={33} stroke={pageLines} strokeWidth={0.7} opacity={0.3} transform="rotate(-10 123 37)" />
						<Line x1={119} y1={36} x2={125} y2={36} stroke={pageLines} strokeWidth={0.7} opacity={0.3} transform="rotate(-10 123 37)" />
					</G>

					{/* Head */}
					<Ellipse cx={52} cy={34} rx={15} ry={13} fill={body} />
					<Path d="M40 23 L42 18 L45 23" fill={bodyDark} />
					<Path d="M45 21 L48 15 L51 21" fill={bodyDark} />
					<Path d="M50 21 L53 16 L55 22" fill={bodyDark} />

					{/* Snout */}
					<Ellipse cx={62} cy={37} rx={9} ry={7} fill={body} />
					<Ellipse cx={63} cy={38} rx={6} ry={5} fill={belly} />
					<Circle cx={67} cy={35} r={1.2} fill={eye} opacity={0.4} />
					<Circle cx={67} cy={38} r={1} fill={eye} opacity={0.3} />
					<Ellipse cx={58} cy={40} rx={3} ry={2} fill={cheek} />

					{/* Eye */}
					<G style={anim("ff-blink 3.5s ease-in-out infinite", "54px 31px")}>
						<Circle cx={54} cy={31} r={4.5} fill="white" />
						<G style={anim("ff-eyetrack 2.5s ease-in-out infinite")}>
							<Circle cx={56} cy={31} r={2.5} fill={eye} />
							<Circle cx={57} cy={30} r={0.8} fill="white" />
						</G>
					</G>

					{/* Smile */}
					<Path d="M59 41 Q63 44 67 41" stroke={eye} strokeWidth={0.8} fill="none" strokeLinecap="round" />
				</G>
			</Svg>
		</View>
	);
}
