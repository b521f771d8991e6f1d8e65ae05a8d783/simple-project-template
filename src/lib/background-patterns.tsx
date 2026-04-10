import React from "react";
import { Circle, Defs, Line, Path, Pattern, Rect } from "react-native-svg";
import type { BackgroundPattern } from "@/redux/state/backgroundSlice";

type PatternRenderer = (accent: string) => React.ReactNode;

interface PatternDef {
	label: string;
	render: PatternRenderer;
}

const patterns: Record<Exclude<BackgroundPattern, "none">, PatternDef> = {
	dots: {
		label: "Dots",
		render: (a) => (
			<>
				<Defs>
					<Pattern id="p-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
						<Circle cx="16" cy="16" r="1.5" fill={a} opacity={0.18} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-dots)" />
			</>
		),
	},

	grid: {
		label: "Grid",
		render: (a) => (
			<>
				<Defs>
					<Pattern id="p-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
						<Path d="M 40 0 L 0 0 0 40" fill="none" stroke={a} strokeWidth={0.5} opacity={0.22} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-grid)" />
			</>
		),
	},

	waves: {
		label: "Waves",
		render: (a) => (
			<>
				<Defs>
					<Pattern id="p-waves" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
						<Path d="M0 20 Q30 5 60 20 Q90 35 120 20" fill="none" stroke={a} strokeWidth={0.8} opacity={0.12} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-waves)" />
			</>
		),
	},

	diagonal: {
		label: "Diagonal",
		render: (a) => (
			<>
				<Defs>
					<Pattern id="p-diag" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
						<Line x1="0" y1="28" x2="28" y2="0" stroke={a} strokeWidth={0.8} opacity={0.10} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-diag)" />
			</>
		),
	},

	circuit: {
		label: "Circuit",
		render: (a) => (
			<>
				<Defs>
					<Pattern id="p-circ" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
						<Line x1="0" y1="40" x2="80" y2="40" stroke={a} strokeWidth={0.8} opacity={0.14} />
						<Line x1="40" y1="0" x2="40" y2="80" stroke={a} strokeWidth={0.8} opacity={0.14} />
						<Line x1="10" y1="10" x2="10" y2="22" stroke={a} strokeWidth={0.6} opacity={0.12} />
						<Line x1="10" y1="22" x2="22" y2="22" stroke={a} strokeWidth={0.6} opacity={0.12} />
						<Line x1="58" y1="58" x2="70" y2="58" stroke={a} strokeWidth={0.6} opacity={0.12} />
						<Line x1="70" y1="58" x2="70" y2="70" stroke={a} strokeWidth={0.6} opacity={0.12} />
						<Circle cx="40" cy="40" r="2.5" fill={a} opacity={0.20} />
						<Circle cx="10" cy="22" r="1.5" fill={a} opacity={0.18} />
						<Circle cx="70" cy="58" r="1.5" fill={a} opacity={0.18} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-circ)" />
			</>
		),
	},

	confetti: {
		label: "Confetti",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-conf" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
						<Rect x="8" y="5" width="4" height="4" rx="1" fill="#ef4444" opacity={0.22} transform="rotate(25 10 7)" />
						<Rect x="38" y="12" width="5" height="3" rx="1" fill="#f59e0b" opacity={0.20} transform="rotate(-15 40 13)" />
						<Rect x="22" y="35" width="3" height="5" rx="1" fill="#22c55e" opacity={0.22} transform="rotate(40 23 37)" />
						<Rect x="50" y="42" width="4" height="3" rx="1" fill="#8b5cf6" opacity={0.20} transform="rotate(-30 52 43)" />
						<Rect x="15" y="50" width="5" height="3" rx="1" fill="#0071e3" opacity={0.22} transform="rotate(10 17 51)" />
						<Circle cx="45" cy="28" r="2" fill="#ec4899" opacity={0.18} />
						<Circle cx="5" cy="25" r="1.5" fill="#f59e0b" opacity={0.20} />
						<Circle cx="55" cy="55" r="1.8" fill="#22c55e" opacity={0.16} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-conf)" />
			</>
		),
	},

	hexagons: {
		label: "Hexagons",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-hex" x="0" y="0" width="56" height="49" patternUnits="userSpaceOnUse">
						<Path d="M28 0 L56 14 L56 42 L28 49 L0 42 L0 14 Z" fill="#8b5cf6" fillOpacity={0.02} stroke="#8b5cf6" strokeWidth={0.6} opacity={0.14} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-hex)" />
			</>
		),
	},

	aurora: {
		label: "Aurora",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-aur" x="0" y="0" width="300" height="200" patternUnits="userSpaceOnUse">
						<Rect width="300" height="200" fill="#22c55e" opacity={0.02} />
						<Path d="M0 80 Q75 40 150 90 Q225 140 300 70" fill="none" stroke="#22c55e" strokeWidth={1.2} opacity={0.10} />
						<Path d="M0 120 Q75 160 150 110 Q225 60 300 130" fill="none" stroke="#06b6d4" strokeWidth={1} opacity={0.08} />
						<Path d="M0 150 Q100 100 200 160 Q250 180 300 140" fill="none" stroke="#8b5cf6" strokeWidth={0.8} opacity={0.07} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-aur)" />
			</>
		),
	},

	bubbles: {
		label: "Bubbles",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-bub" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
						<Circle cx="20" cy="20" r="12" fill="#0071e3" fillOpacity={0.02} stroke="#0071e3" strokeWidth={0.6} opacity={0.12} />
						<Circle cx="80" cy="15" r="8" fill="#ec4899" fillOpacity={0.02} stroke="#ec4899" strokeWidth={0.5} opacity={0.10} />
						<Circle cx="55" cy="60" r="18" fill="#8b5cf6" fillOpacity={0.015} stroke="#8b5cf6" strokeWidth={0.7} opacity={0.10} />
						<Circle cx="105" cy="75" r="10" fill="#22c55e" fillOpacity={0.02} stroke="#22c55e" strokeWidth={0.5} opacity={0.11} />
						<Circle cx="25" cy="95" r="14" fill="#f59e0b" fillOpacity={0.02} stroke="#f59e0b" strokeWidth={0.6} opacity={0.10} />
						<Circle cx="95" cy="110" r="6" fill="none" stroke="#ef4444" strokeWidth={0.4} opacity={0.12} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-bub)" />
			</>
		),
	},

	carbon: {
		label: "Carbon",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-crb" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
						<Rect width="10" height="10" fill="#1a1a1a" opacity={0.03} />
						<Rect x="0" y="0" width="5" height="5" fill="#000" opacity={0.04} />
						<Rect x="5" y="5" width="5" height="5" fill="#000" opacity={0.04} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-crb)" />
			</>
		),
	},

	blueprint: {
		label: "Blueprint",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-bp" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
						<Rect width="100" height="100" fill="#0a1628" opacity={0.03} />
						<Path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e3a5f" strokeWidth={0.4} opacity={0.18} />
						<Line x1="50" y1="0" x2="50" y2="100" stroke="#1e3a5f" strokeWidth={0.2} opacity={0.10} />
						<Line x1="0" y1="50" x2="100" y2="50" stroke="#1e3a5f" strokeWidth={0.2} opacity={0.10} />
						<Circle cx="0" cy="0" r="1.5" fill="#1e3a5f" opacity={0.20} />
						<Circle cx="100" cy="0" r="1.5" fill="#1e3a5f" opacity={0.20} />
						<Circle cx="0" cy="100" r="1.5" fill="#1e3a5f" opacity={0.20} />
						<Circle cx="100" cy="100" r="1.5" fill="#1e3a5f" opacity={0.20} />
						<Circle cx="50" cy="50" r="1" fill="#1e3a5f" opacity={0.12} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-bp)" />
			</>
		),
	},

	radar: {
		label: "Radar",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-rad" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
						<Circle cx="100" cy="100" r="25" fill="none" stroke="#059669" strokeWidth={0.5} opacity={0.14} />
						<Circle cx="100" cy="100" r="50" fill="none" stroke="#059669" strokeWidth={0.5} opacity={0.11} />
						<Circle cx="100" cy="100" r="75" fill="none" stroke="#059669" strokeWidth={0.5} opacity={0.08} />
						<Circle cx="100" cy="100" r="100" fill="none" stroke="#059669" strokeWidth={0.5} opacity={0.06} />
						<Line x1="100" y1="0" x2="100" y2="200" stroke="#059669" strokeWidth={0.3} opacity={0.10} />
						<Line x1="0" y1="100" x2="200" y2="100" stroke="#059669" strokeWidth={0.3} opacity={0.10} />
						<Line x1="0" y1="0" x2="200" y2="200" stroke="#059669" strokeWidth={0.2} opacity={0.06} />
						<Line x1="200" y1="0" x2="0" y2="200" stroke="#059669" strokeWidth={0.2} opacity={0.06} />
						<Circle cx="130" cy="70" r="2" fill="#059669" opacity={0.25} />
						<Circle cx="85" cy="115" r="1.5" fill="#059669" opacity={0.20} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-rad)" />
			</>
		),
	},

	mesh: {
		label: "Mesh",
		render: () => (
			<>
				<Defs>
					<Pattern id="p-mesh" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
						<Line x1="0" y1="0" x2="40" y2="40" stroke="#374151" strokeWidth={0.4} opacity={0.12} />
						<Line x1="80" y1="0" x2="40" y2="40" stroke="#374151" strokeWidth={0.4} opacity={0.12} />
						<Line x1="0" y1="80" x2="40" y2="40" stroke="#374151" strokeWidth={0.4} opacity={0.12} />
						<Line x1="80" y1="80" x2="40" y2="40" stroke="#374151" strokeWidth={0.4} opacity={0.12} />
						<Line x1="40" y1="0" x2="40" y2="80" stroke="#374151" strokeWidth={0.3} opacity={0.08} />
						<Line x1="0" y1="40" x2="80" y2="40" stroke="#374151" strokeWidth={0.3} opacity={0.08} />
						<Circle cx="40" cy="40" r="1.5" fill="#374151" opacity={0.18} />
						<Circle cx="0" cy="0" r="1" fill="#374151" opacity={0.14} />
						<Circle cx="80" cy="0" r="1" fill="#374151" opacity={0.14} />
						<Circle cx="0" cy="80" r="1" fill="#374151" opacity={0.14} />
						<Circle cx="80" cy="80" r="1" fill="#374151" opacity={0.14} />
					</Pattern>
				</Defs>
				<Rect width="100%" height="100%" fill="url(#p-mesh)" />
			</>
		),
	},
};

export function getPatternRenderer(key: BackgroundPattern): PatternRenderer | null {
	if (key === "none") return null;
	return patterns[key]?.render ?? null;
}

export function getPatternLabel(key: BackgroundPattern): string {
	if (key === "none") return "None";
	return patterns[key]?.label ?? key;
}

export const PATTERN_OPTIONS: { key: BackgroundPattern; label: string }[] = [
	{ key: "none", label: "None" },
	...Object.entries(patterns).map(([key, def]) => ({ key: key as BackgroundPattern, label: def.label })),
];

/**
 * Image backgrounds. Not color-configurable; work in both light and dark mode.
 * Keys are stored in Redux; sources are resolved locally via require().
 */
export const IMAGE_PRESETS: { key: string; label: string; source: ReturnType<typeof require> }[] = [
	{ key: "abstract-flow", label: "Abstract Flow", source: require("@/assets/backgrounds/abstract-flow.svg") },
	{ key: "abstract-art",  label: "Abstract Art",  source: require("@/assets/backgrounds/abstract-art.svg") },
];

export function getImageSource(key: string): ReturnType<typeof require> | null {
	return IMAGE_PRESETS.find((p) => p.key === key)?.source ?? null;
}

/** Dark preset backgrounds — pattern uses low-opacity white. */
const DARK_BG_COLORS = new Set([
	"#4a4a52", "#52525b", "#3d5166", "#3a5244", "#5b4a6e", "#2e4f6e",
	"#002395", "#003476", // French Navy, Greek Lazure
	"#002868", "#6d0717", "#5f0013", "#001f6b", "#7a1516",
	"#004d25", "#003d66", "#005421", "#7a4a00", "#665c00", "#003d24",
]);

/** Vivid/saturated backgrounds (e.g. Austrian Red) — pattern uses higher-opacity white. */
const VIVID_BG_COLORS = new Set([
	"#c8102e", // Austrian Red
	"#bc002d", // Japanese Crimson
	"#0038b8", // Hebrew Blue
	"#ef2b2d", // Norwegian Red
	"#009246", // Italian Emerald
	"#006aa7", // Swedish Cobalt
	"#009c3b", // Brazilian Jade
	"#ff9933", // Indian Saffron
	"#ffcc00", // German Gold
	"#007a4d", // South African Green
	"#b22234", // American Red
]);

/**
 * Returns the color to use for SVG pattern nodes/lines.
 * Uses white when the background is dark or vivid so the pattern remains visible.
 */
export function getPatternColor(bgColor: string | null, accentColor: string): string {
	if (!bgColor) return accentColor;
	const lower = bgColor.toLowerCase();
	if (VIVID_BG_COLORS.has(lower)) return "rgba(255,255,255,0.75)";
	if (DARK_BG_COLORS.has(lower)) return "rgba(255,255,255,0.45)";
	return accentColor;
}

export const COLOR_PRESETS: { label: string; value: string | null; dark?: boolean; accentOverride?: string }[] = [
	// Light
	{ label: "Whispering White",  value: "#ffffff" },
	{ label: "Serene Silver",     value: "#f5f5f7" },
	{ label: "Immaculate Ice",    value: "#e8f0fe" },
	{ label: "Sheer Sky",         value: "#dbeafe" },
	{ label: "Misty Mint",        value: "#ecfdf5" },
	{ label: "Silken Sage",       value: "#d1fae5" },
	{ label: "Calm Cream",        value: "#fef9c3" },
	{ label: "Playful Peach",     value: "#ffedd5" },
	{ label: "Bashful Blush",     value: "#fce7f3" },
	{ label: "Radiant Rose",      value: "#ffe4e6" },
	{ label: "Lush Lilac",        value: "#f3e8ff" },
	{ label: "Sunlit Sand",       value: "#f5f0e8" },
	{ label: "Stellar Steel",     value: "#d6e8f7" },
	{ label: "Austrian Red",      value: "#c8102e" },
	{ label: "Japanese Crimson",  value: "#bc002d" },
	{ label: "Hebrew Blue",       value: "#0038b8" },
	{ label: "Norwegian Red",     value: "#ef2b2d" },
	{ label: "Italian Emerald",   value: "#009246" },
	{ label: "Swedish Cobalt",    value: "#006aa7" },
	{ label: "Brazilian Jade",    value: "#009c3b" },
	{ label: "Indian Saffron",    value: "#ff9933" },
	{ label: "German Gold",       value: "#ffcc00" },
	{ label: "South African Green", value: "#007a4d" },
	{ label: "American Red",      value: "#b22234" },
	{ label: "Upper Austrian Gold", value: "#ffffff", accentOverride: "#baa47e" },
	{ label: "Upper Austrian Red",  value: "#ffffff", accentOverride: "#e22933" },
	// Dark
	{ label: "Grounded Graphite", value: "#4a4a52", dark: true },
	{ label: "Cool Charcoal",   value: "#52525b", dark: true },
	{ label: "Deep Denim",      value: "#3d5166", dark: true },
	{ label: "Faded Forest",    value: "#3a5244", dark: true },
	{ label: "Pensive Plum",    value: "#5b4a6e", dark: true },
	{ label: "Opulent Ocean",   value: "#2e4f6e", dark: true },
	{ label: "French Navy",       value: "#002395", dark: true },
	{ label: "Greek Lazure",      value: "#003476", dark: true },
	{ label: "American Blue",     value: "#002868", dark: true },
	{ label: "Austrian Burgundy", value: "#6d0717", dark: true },
	{ label: "Japanese Maroon",   value: "#5f0013", dark: true },
	{ label: "Hebrew Midnight",   value: "#001f6b", dark: true },
	{ label: "Norwegian Ruby",    value: "#7a1516", dark: true },
	{ label: "Italian Hunter",    value: "#004d25", dark: true },
	{ label: "Swedish Night",     value: "#003d66", dark: true },
	{ label: "Brazilian Rainforest", value: "#005421", dark: true },
	{ label: "Indian Spice",      value: "#7a4a00", dark: true },
	{ label: "German Amber",      value: "#665c00", dark: true },
	{ label: "South African Moss", value: "#003d24", dark: true },
];
