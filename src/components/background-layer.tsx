import { Image, Platform, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBackground } from "@/hooks/use-background";
import { Colors } from "@/constants/theme";
import { getPatternRenderer, getImageSource } from "@/lib/background-patterns";

const fillStyle = Platform.OS === "web"
	? ({ position: "fixed" as any, inset: 0, zIndex: -1, width: "100%", height: "100%" })
	: [StyleSheet.absoluteFill, { zIndex: -1 }];

export function BackgroundLayer() {
	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];
	const { pattern, color, image } = useBackground();

	// Image backgrounds take full priority — no color or pattern overlay
	if (image) {
		const source = getImageSource(image);
		if (source) {
			return (
				<Image
					source={source}
					style={[fillStyle, { objectFit: "cover" } as any]}
					resizeMode="cover"
				/>
			);
		}
	}

	const bgColor = color ?? c.background;
	const renderer = getPatternRenderer(pattern);

	// Nothing custom — let the theme handle it
	if (!renderer && !color) return null;

	return (
		<Svg
			width="100%"
			height="100%"
			style={fillStyle as any}
			pointerEvents="none"
		>
			<Rect width="100%" height="100%" fill={bgColor} />
			{renderer?.(c.accent)}
		</Svg>
	);
}
