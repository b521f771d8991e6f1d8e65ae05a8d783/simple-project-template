import { Animated, StyleSheet, Platform, type ViewStyle, type StyleProp } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";
import { useScaleAnimation } from "@/hooks/use-scale-animation";

interface LiquidGlassProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	/** Optional section title rendered inside the glass surface */
	title?: string;
	/** Corner radius — defaults to 20 for a soft card feel */
	radius?: number;
	/** Extra padding inside the glass surface */
	padding?: number;
}

/**
 * A frosted-glass surface that blurs content behind it.
 * On web uses backdrop-filter; on native falls back to a semi-transparent surface.
 */
export function LiquidGlass({ children, style, title, radius = 20, padding = 16 }: LiquidGlassProps) {
	const colorScheme = useColorScheme();
	const dark = colorScheme === "dark";
	const { scale, hoverHandlers } = useScaleAnimation(1.003, 1);

	const bg     = dark ? "rgba(45,45,47,0.12)"      : "rgba(255,255,255,0.12)";
	const border = dark ? "rgba(255,255,255,0.14)"   : "rgba(0,0,0,0.08)";
	const shadow = dark ? "rgba(0,0,0,0.28)"         : "rgba(0,0,0,0.13)";

	const webExtra = Platform.OS === "web"
		? ({
				backdropFilter: "blur(12px) saturate(140%)",
				WebkitBackdropFilter: "blur(12px) saturate(140%)",
				boxShadow: dark
					? "0 2px 12px rgba(0,0,0,0.28)"
					: "0 4px 24px rgba(0,0,0,0.10)",
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
			{title ? (
				<ThemedText type="headline" style={styles.title}>{title}</ThemedText>
			) : null}
			{children}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	base: {
		borderWidth: StyleSheet.hairlineWidth,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 14,
		elevation: 6,
	},
	title: {
		marginBottom: 12,
	},
});
