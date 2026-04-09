import { Animated, StyleSheet, Platform, type ViewStyle, type StyleProp } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScaleAnimation } from "@/hooks/use-scale-animation";

interface LiquidGlassProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	/** Corner radius — defaults to 12 to match iOS inset-grouped sections */
	radius?: number;
	/** Extra padding inside the glass surface */
	padding?: number;
}

/**
 * A frosted-glass surface that blurs content behind it.
 * On web uses backdrop-filter; on native falls back to a semi-transparent surface.
 */
export function LiquidGlass({ children, style, radius = 12, padding = 16 }: LiquidGlassProps) {
	const colorScheme = useColorScheme();
	const dark = colorScheme === "dark";
	const { scale, hoverHandlers } = useScaleAnimation(1.003, 1);

	const bg     = dark ? "rgba(28,28,30,0.82)"      : "rgba(255,255,255,0.78)";
	const border = dark ? "rgba(255,255,255,0.10)"   : "rgba(0,0,0,0.07)";
	const shadow = dark ? "rgba(0,0,0,0.20)"         : "rgba(0,0,0,0.08)";

	const webExtra = Platform.OS === "web"
		? ({
				backdropFilter: "blur(20px) saturate(180%)",
				WebkitBackdropFilter: "blur(20px) saturate(180%)",
				boxShadow: dark
					? "0 1px 8px rgba(0,0,0,0.20)"
					: "0 2px 12px rgba(0,0,0,0.07)",
		  } as any)
		: {};

	return (
		<Animated.View
			style={[
				styles.base,
				{
					backgroundColor: bg,
					borderColor: border,
					borderRadius: radius,
					padding,
					shadowColor: shadow,
					transform: [{ scale }],
					...webExtra,
				},
				style,
			]}
			{...(hoverHandlers as any)}
		>
			{children}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	base: {
		borderWidth: StyleSheet.hairlineWidth,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 4,
	},
});
