import { Text, type TextProps, StyleSheet, Platform } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

const fontFamily = Platform.OS === "macos" ? undefined : "Arial";

export type ThemedTextProps = TextProps & {
	lightColor?: string;
	darkColor?: string;
	type?: "title" | "subtitle" | "headline" | "body" | "caption" | "default" | "semibold";
};

const typeStyles: Record<NonNullable<ThemedTextProps["type"]>, object> = {
	title:    { fontSize: 28, fontWeight: "700", letterSpacing: -0.4, lineHeight: 34 },
	subtitle: { fontSize: 22, fontWeight: "600", letterSpacing: -0.2, lineHeight: 28 },
	headline: { fontSize: 17, fontWeight: "600", letterSpacing: 0,    lineHeight: 22 },
	body:     { fontSize: 17, fontWeight: "400", letterSpacing: 0,    lineHeight: 22 },
	caption:  { fontSize: 12, fontWeight: "400", letterSpacing: 0,    lineHeight: 16 },
	// legacy aliases
	default:  { fontSize: 17, fontWeight: "400", letterSpacing: 0,    lineHeight: 22 },
	semibold: { fontSize: 17, fontWeight: "600", letterSpacing: 0,    lineHeight: 22 },
};

export function ThemedText({
	lightColor,
	darkColor,
	type = "body",
	style,
	...rest
}: ThemedTextProps) {
	const color = useThemeColor(
		{ light: lightColor, dark: darkColor },
		"text",
	);

	return (
		<Text
			style={[{ color, fontFamily }, typeStyles[type], style]}
			{...rest}
		/>
	);
}
