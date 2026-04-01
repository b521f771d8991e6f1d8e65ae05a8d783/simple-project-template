import { Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
	lightColor?: string;
	darkColor?: string;
	type?: "default" | "title" | "subtitle" | "semibold" | "caption";
};

const typeClasses: Record<NonNullable<ThemedTextProps["type"]>, string> = {
	default: "text-base",
	title: "text-2xl font-bold",
	subtitle: "text-xl font-bold",
	semibold: "text-base font-semibold",
	caption: "text-sm",
};

export function ThemedText({
	className,
	lightColor,
	darkColor,
	type = "default",
	style,
	...rest
}: ThemedTextProps) {
	const color = useThemeColor(
		{ light: lightColor, dark: darkColor },
		"text",
	);

	return (
		<Text
			className={`${typeClasses[type]} ${className ?? ""}`}
			style={[{ color }, style]}
			{...rest}
		/>
	);
}
