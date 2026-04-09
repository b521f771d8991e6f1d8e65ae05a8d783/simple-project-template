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
		secondary:   dark ? "#000" : "#fff",
		destructive: "#fff",
		outline:     dark ? "#2997ff" : "#0071e3",
	};

	const sizes = {
		sm: { px: 16, py: 8,  fs: 14 },
		md: { px: 22, py: 10, fs: 17 },
	}[size];

	const bg: Record<V, string> = {
		primary:     dark ? "#2997ff" : "#0071e3",
		secondary:   dark ? "#f5f5f7" : "#1d1d1f",
		destructive: "#b91c1c",
		outline:     "transparent",
	};

	const border: Record<V, string> = {
		primary:     "transparent",
		secondary:   "transparent",
		destructive: "transparent",
		outline:     dark ? "rgba(41,151,255,0.5)" : "rgba(0,113,227,0.35)",
	};

	const shadowStyle: object = Platform.OS !== "web"
		? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 3, elevation: 2 }
		: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } as any;

	return (
		<Animated.View
			style={[{ transform: [{ scale }] }, shadowStyle]}
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
							borderWidth: variant === "outline" ? 1.5 : 0,
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
		fontWeight: "500",
		letterSpacing: -0.1,
		zIndex: 1,
	},
});
