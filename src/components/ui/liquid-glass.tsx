import { View, StyleSheet, Platform, type ViewStyle, type StyleProp } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";

if (Platform.OS === "web" && typeof document !== "undefined") {
	const id = "liquid-glass-hover-style";
	if (!document.getElementById(id)) {
		const s = document.createElement("style");
		s.id = id;
		s.textContent = ".liquid-glass{transition:transform .2s cubic-bezier(.34,1.56,.64,1)}.liquid-glass:hover{transform:scale(1.015)}";
		document.head.appendChild(s);
	}
}

interface LiquidGlassProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	/** Optional section title rendered above the glass surface */
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

	const bg = dark ? "rgba(45,45,47,0.92)" : "rgba(255,255,255,0.92)";
	const border = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)";
	const shadow = dark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.13)";

	const webExtra =
		Platform.OS === "web"
			? ({
					backdropFilter: "blur(24px) saturate(180%)",
					WebkitBackdropFilter: "blur(24px) saturate(180%)",
					boxShadow: dark
						? "0 4px 24px rgba(0,0,0,0.55)"
						: "0 4px 24px rgba(0,0,0,0.10)",
			  } as any)
			: {};

	return (
		<View
			className="liquid-glass"
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
			{title ? (
				<ThemedText type="headline" style={styles.title}>{title}</ThemedText>
			) : null}
			{children}
		</View>
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
