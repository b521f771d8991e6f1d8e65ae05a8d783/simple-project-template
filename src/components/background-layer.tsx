import { StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBackground } from "@/hooks/use-background";
import { Colors } from "@/constants/theme";
import { getPatternRenderer } from "@/lib/background-patterns";

export function BackgroundLayer() {
	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];
	const { pattern, color } = useBackground();

	const bgColor = color ?? c.background;
	const renderer = getPatternRenderer(pattern);

	// Nothing custom — let the theme handle it
	if (!renderer && !color) return null;

	return (
		<Svg
			width="100%"
			height="100%"
			style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
			pointerEvents="none"
		>
			<Rect width="100%" height="100%" fill={bgColor} />
			{renderer?.(c.accent)}
		</Svg>
	);
}
