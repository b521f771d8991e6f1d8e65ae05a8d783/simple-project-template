import { View, StyleSheet, Platform, type ViewStyle, type StyleProp } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface LiquidGlassProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	/** Corner radius — defaults to 20 for a soft card feel */
	radius?: number;
	/** Extra padding inside the glass surface */
	padding?: number;
}

/**
 * A frosted-glass surface that blurs content behind it.
 * On web uses backdrop-filter; on native falls back to a semi-transparent surface.
 */
export function LiquidGlass({ children, style, radius = 20, padding = 16 }: LiquidGlassProps) {
	const colorScheme = useColorScheme();
	const dark = colorScheme === "dark";

	const bg = dark ? "rgba(45,45,47,0.65)" : "rgba(255,255,255,0.65)";
	const border = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)";
	const shadow = dark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)";

	const webExtra =
		Platform.OS === "web"
			? ({
					backdropFilter: "blur(24px) saturate(180%)",
					WebkitBackdropFilter: "blur(24px) saturate(180%)",
			  } as any)
			: {};

	return (
		<View
			style={[
				styles.base,
				{
					backgroundColor: bg,
					borderColor: border,
					borderRadius: radius,
					padding,
					shadowColor: shadow,
					...webExtra,
				},
				style,
			]}
		>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		borderWidth: StyleSheet.hairlineWidth,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 6,
	},
});
