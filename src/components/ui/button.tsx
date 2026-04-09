import { Animated, Pressable, Text, View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScaleAnimation } from "@/hooks/use-scale-animation";

export interface ButtonProps {
	label: string;
	onPress?: () => void;
	variant?: "primary" | "secondary" | "destructive" | "outline";
	size?: "sm" | "md";
	disabled?: boolean;
	loading?: boolean;
}

type V = NonNullable<ButtonProps["variant"]>;

export function Button({
	label,
	onPress,
	variant = "primary",
	size = "md",
	disabled = false,
	loading = false,
}: ButtonProps) {
	const colorScheme = useColorScheme();
	const dark = colorScheme === "dark";
	const { scale, hoverHandlers, pressHandlers } = useScaleAnimation(1.01, 0.97);

	const fg: Record<V, string> = {
		primary:     "#fff",
		secondary:   dark ? "#f5f5f7" : "#1d1d1f",
		destructive: "#fff",
		outline:     dark ? "#2997ff" : "#0071e3",
	};

	const sizes = {
		sm: { px: 14, py: 7,  fs: 13 },
		md: { px: 20, py: 9, fs: 15 },
	}[size];

	const bg: Record<V, string> = {
		primary:     dark ? "#2997ff" : "#0071e3",
		secondary:   dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)",
		destructive: "#c0392b",
		outline:     "transparent",
	};

	const border: Record<V, string> = {
		primary:     "transparent",
		secondary:   dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
		destructive: "transparent",
		outline:     dark ? "rgba(41,151,255,0.6)" : "rgba(0,113,227,0.45)",
	};

	// macOS-style depth: filled buttons get a drop shadow; bordered buttons get an inset highlight
	const filledVariant = variant === "primary" || variant === "destructive";
	const webShadow = filledVariant
		? `0 1px 3px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.12)`
		: dark
			? `inset 0 0.5px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(255,255,255,0.06)`
			: `inset 0 0.5px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(0,0,0,0.09), 0 0 0 0.5px rgba(0,0,0,0.07)`;

	const shadowStyle: object = Platform.OS !== "web"
		? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 }
		: { boxShadow: webShadow } as any;

	// Subtle top-to-bottom gradient overlay for depth (web only)
	const gradientOverlay = Platform.OS === "web" ? {
		backgroundImage: filledVariant
			? `linear-gradient(180deg, rgba(255,255,255,${dark ? "0.10" : "0.14"}) 0%, rgba(0,0,0,0.06) 100%)`
			: `linear-gradient(180deg, rgba(255,255,255,${dark ? "0.06" : "0.50"}) 0%, rgba(0,0,0,0.04) 100%)`,
	} as any : {};

	return (
		<Animated.View
			style={[{ transform: [{ scale }], borderRadius: 980 }, shadowStyle]}
			{...(hoverHandlers as any)}
		>
			<Pressable
				onPress={disabled || loading ? undefined : onPress}
				{...pressHandlers}
				accessibilityRole="button"
				accessibilityLabel={label}
				accessibilityState={{ disabled: disabled || loading }}
				style={[
					styles.outer,
					{ opacity: disabled ? 0.38 : 1, minHeight: 44 },
				]}
			>
				<View
					pointerEvents="none"
					style={[
						styles.fill,
						{
							backgroundColor: bg[variant],
							borderColor: border[variant],
							borderWidth: variant === "outline" ? 1.5 : variant === "secondary" ? StyleSheet.hairlineWidth : 0,
							...gradientOverlay,
						},
					]}
				/>
				{loading ? (
					<ActivityIndicator
						size="small"
						color={fg[variant]}
						style={{ zIndex: 1, paddingHorizontal: sizes.px, paddingVertical: sizes.py }}
					/>
				) : (
					<Text
						style={[
							styles.label,
							{
								color: fg[variant],
								fontSize: sizes.fs,
								paddingHorizontal: sizes.px,
								paddingVertical: sizes.py,
							},
						]}
					>
						{label}
					</Text>
				)}
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	outer: {
		borderRadius: 980,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	fill: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 980,
	},
	label: {
		fontWeight: "600",
		letterSpacing: -0.2,
		zIndex: 1,
	},
});
