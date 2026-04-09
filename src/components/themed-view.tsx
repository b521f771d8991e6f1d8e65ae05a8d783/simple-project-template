import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useBackground } from "@/hooks/use-background";

export type ThemedViewProps = ViewProps & {
	lightColor?: string;
	darkColor?: string;
};

export function ThemedView({
	className,
	style,
	lightColor,
	darkColor,
	...rest
}: ThemedViewProps) {
	const { pattern, color, image } = useBackground();
	const hasCustomBg = pattern !== "none" || color !== null || image !== null;
	const backgroundColor = useThemeColor(
		{ light: lightColor, dark: darkColor },
		"background",
	);
	// When no explicit color is provided and a custom background is active,
	// let the root BackgroundLayer show through.
	const effectiveBg = (!lightColor && !darkColor && hasCustomBg)
		? "transparent"
		: backgroundColor;

	return (
		<View
			className={className}
			style={[{ backgroundColor: effectiveBg }, style]}
			{...rest}
		/>
	);
}
