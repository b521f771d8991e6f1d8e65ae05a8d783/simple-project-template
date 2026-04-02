import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path } from "react-native-svg";

function injectKeyframes() {
	if (Platform.OS !== "web" || typeof document === "undefined") return;
	const id = "dino-sleeping-keyframes";
	if (document.getElementById(id)) return;
	const style = document.createElement("style");
	style.id = id;
	style.textContent = [
		"@keyframes ff-sleep-breathe{0%,100%{transform:scaleX(1) scaleY(1)}50%{transform:scaleX(1.04) scaleY(0.96)}}",
		"@keyframes ff-sleep-tail{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}",
		"@keyframes ff-sleep-hover{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}",
	].join("");
	document.head.appendChild(style);
}

function anim(css: string, origin?: string): Record<string, unknown> {
	if (Platform.OS !== "web") return {};
	const s: Record<string, unknown> = { animation: css };
	if (origin) s.transformOrigin = origin;
	return s;
}

export function SleepingDino({ dark }: { dark: boolean }) {
	useEffect(() => injectKeyframes(), []);

	const body = dark ? "#4ade80" : "#22c55e";
	const bodyDark = dark ? "#22c55e" : "#16a34a";
	const belly = dark ? "#bbf7d0" : "#86efac";
	const eye = dark ? "#052e16" : "#14532d";
	const cheek = dark ? "rgba(251,191,36,0.25)" : "rgba(251,191,36,0.3)";

	return (
		<View style={{ width: 120, height: 120, alignItems: "center", justifyContent: "center" }}>
			<Svg viewBox="2 18 76 76" width={120} height={120} fill="none">
				<G style={anim("ff-sleep-hover 3s ease-in-out infinite", "50px 65px")}>

					{/* Tail */}
					<G style={anim("ff-sleep-tail 2.5s ease-in-out infinite", "28px 68px")}>
						<Path d="M28 68 Q16 62 10 50 Q7 42 10 40 Q14 42 16 48 Q22 56 26 64" fill={body} />
						<Circle cx={10} cy={41} r={2.5} fill={bodyDark} />
						<Circle cx={14} cy={44} r={2} fill={bodyDark} />
					</G>

					{/* Body */}
					<G style={anim("ff-sleep-breathe 4s ease-in-out infinite", "48px 70px")}>
						<Ellipse cx={48} cy={70} rx={24} ry={18} fill={body} />
						<Ellipse cx={50} cy={73} rx={15} ry={11} fill={belly} />
					</G>

					{/* Feet */}
					<Ellipse cx={34} cy={86} rx={8} ry={3} fill={bodyDark} />
					<Ellipse cx={56} cy={86} rx={8} ry={3} fill={bodyDark} />
					<Circle cx={28} cy={85} r={1.5} fill={bodyDark} />
					<Circle cx={32} cy={84} r={1.5} fill={bodyDark} />
					<Circle cx={50} cy={84} r={1.5} fill={bodyDark} />
					<Circle cx={54} cy={85} r={1.5} fill={bodyDark} />

					{/* Arms — curled up */}
					<Path d="M38 64 Q34 70 36 76" stroke={body} strokeWidth={4} strokeLinecap="round" fill="none" />
					<Circle cx={36} cy={76} r={2.5} fill={body} />
					<Path d="M58 66 Q62 72 60 77" stroke={body} strokeWidth={4} strokeLinecap="round" fill="none" />
					<Circle cx={60} cy={77} r={2.5} fill={body} />

					{/* Head — tilted */}
					<G transform="rotate(8 52 44)">
						<Ellipse cx={52} cy={44} rx={15} ry={13} fill={body} />

						{/* Spines */}
						<Path d="M40 33 L42 28 L45 33" fill={bodyDark} />
						<Path d="M45 31 L48 25 L51 31" fill={bodyDark} />
						<Path d="M50 31 L53 26 L55 32" fill={bodyDark} />

						{/* Snout */}
						<Ellipse cx={62} cy={47} rx={9} ry={7} fill={body} />
						<Ellipse cx={63} cy={48} rx={6} ry={5} fill={belly} />
						<Circle cx={67} cy={45} r={1.2} fill={eye} opacity={0.4} />
						<Circle cx={67} cy={48} r={1} fill={eye} opacity={0.3} />

						{/* Cheek blush */}
						<Ellipse cx={58} cy={50} rx={3.5} ry={2.2} fill={cheek} />

						{/* Closed eyes */}
						<Path d="M50 41 Q54 38 58 41" stroke={eye} strokeWidth={1.5} fill="none" strokeLinecap="round" />
						<Line x1={50} y1={41} x2={49} y2={39} stroke={eye} strokeWidth={0.8} strokeLinecap="round" />
						<Line x1={58} y1={41} x2={59} y2={39} stroke={eye} strokeWidth={0.8} strokeLinecap="round" />

						{/* Sleepy smile */}
						<Path d="M59 52 Q63 55 67 52" stroke={eye} strokeWidth={0.8} fill="none" strokeLinecap="round" />

						{/* Sleep bubble */}
						<Circle cx={70} cy={43} r={1.5} fill="none" stroke={eye} strokeWidth={0.6} opacity={0.4} />
					</G>

				</G>
			</Svg>
		</View>
	);
}
