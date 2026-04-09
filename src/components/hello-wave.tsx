import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import Svg, { G, Rect, Ellipse, Path, Circle } from "react-native-svg";

function injectKeyframes() {
	if (Platform.OS !== "web" || typeof document === "undefined") return;
	const id = "hello-wave-kf";
	if (document.getElementById(id)) return;
	const style = document.createElement("style");
	style.id = id;
	style.textContent = [
		"@keyframes hw-wave{0%,100%{transform:rotate(-18deg)}40%{transform:rotate(16deg)}70%{transform:rotate(-8deg)}}",
		"@keyframes hw-star{0%,45%,100%{opacity:0;transform:scale(0.2)}55%,85%{opacity:1;transform:scale(1)}}",
	].join("");
	document.head.appendChild(style);
}

function anim(css: string, origin?: string): Record<string, unknown> {
	if (Platform.OS !== "web") return {};
	const s: Record<string, unknown> = { animation: css };
	if (origin) s.transformOrigin = origin;
	return s;
}

export function HelloWave() {
	useEffect(() => injectKeyframes(), []);

	const skin  = "#FBBF24";
	const shade = "#D97706";
	const light = "#FDE68A";
	const nail  = "#FEF9C3";
	const star  = "#FCD34D";

	return (
		<View style={{ width: 48, height: 52 }}>
			<Svg viewBox="0 0 72 76" width={48} height={52} fill="none">

				{/* Sparkles */}
				<G style={anim("hw-star 1.1s ease-in-out 0.1s infinite")}>
					<Path d="M5 26 L6.2 22 L7.4 26 L11.4 27.2 L7.4 28.4 L6.2 32.4 L5 28.4 L1 27.2 Z" fill={star} />
				</G>
				<G style={anim("hw-star 1.1s ease-in-out 0.55s infinite")}>
					<Path d="M63 12 L64 9 L65 12 L68 13 L65 14 L64 17 L63 14 L60 13 Z" fill={star} />
				</G>
				<G style={anim("hw-star 1.1s ease-in-out 1.0s infinite")}>
					<Circle cx={67} cy={30} r={2.5} fill={star} />
				</G>

				{/* Hand — waves from wrist pivot at bottom-center */}
				<G style={anim("hw-wave 1.1s ease-in-out infinite", "36px 72px")}>

					{/* Pinky */}
					<Rect x={10} y={22} width={8}  height={22} rx={4}   fill={skin} />
					<Rect x={11.5} y={23} width={5} height={5.5} rx={2.5} fill={nail} opacity={0.8} />

					{/* Ring */}
					<Rect x={20} y={15} width={9}  height={27} rx={4.5} fill={skin} />
					<Rect x={21.5} y={16} width={6} height={6.5} rx={3}   fill={nail} opacity={0.8} />

					{/* Middle (tallest) */}
					<Rect x={31} y={10} width={10} height={32} rx={5}   fill={skin} />
					<Rect x={32.5} y={11} width={7} height={7}   rx={3.5} fill={nail} opacity={0.8} />

					{/* Index */}
					<Rect x={43} y={15} width={9}  height={27} rx={4.5} fill={skin} />
					<Rect x={44.5} y={16} width={6} height={6.5} rx={3}   fill={nail} opacity={0.8} />

					{/* Palm */}
					<Rect x={7} y={38} width={54} height={30} rx={14} fill={skin} />
					{/* Palm top shading */}
					<Rect x={7} y={38} width={54} height={12} rx={10} fill={shade} opacity={0.14} />
					{/* Palm bottom highlight */}
					<Ellipse cx={34} cy={65} rx={22} ry={4} fill={light} opacity={0.22} />

					{/* Thumb — rotated outward on right side */}
					<G transform="rotate(28, 58, 56)">
						<Rect x={54} y={42} width={9} height={22} rx={4.5} fill={skin} />
						<Rect x={55.5} y={43} width={6} height={6} rx={3} fill={nail} opacity={0.8} />
					</G>

					{/* Knuckle dimples */}
					<Ellipse cx={14}   cy={40} rx={2.2} ry={1.4} fill={shade} opacity={0.28} />
					<Ellipse cx={24.5} cy={40} rx={2.2} ry={1.4} fill={shade} opacity={0.28} />
					<Ellipse cx={36}   cy={40} rx={2.2} ry={1.4} fill={shade} opacity={0.28} />
					<Ellipse cx={47.5} cy={40} rx={2.2} ry={1.4} fill={shade} opacity={0.28} />
				</G>
			</Svg>
		</View>
	);
}
