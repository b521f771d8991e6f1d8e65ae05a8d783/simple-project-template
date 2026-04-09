import { useEffect } from "react";
import { Pressable, Text, View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";

function injectCSS() {
	if (Platform.OS !== "web" || typeof document === "undefined") return;
	const id = "apple-btn-css";
	if (document.getElementById(id)) return;
	const s = document.createElement("style");
	s.id = id;
	s.textContent = [
		".apple-btn{transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease!important;cursor:pointer;-webkit-user-select:none;user-select:none;box-shadow:0 1px 3px rgba(0,0,0,0.08)}",
		".apple-btn:hover{transform:scale(1.01)!important;box-shadow:0 3px 10px rgba(0,0,0,0.12)!important}",
		".apple-btn:active{transform:scale(.97)!important;transition-duration:.06s!important;box-shadow:0 0 0 rgba(0,0,0,0)!important}",
	].join("");
	document.head.appendChild(s);
}

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
	useEffect(() => injectCSS(), []);

	const colorScheme = useColorScheme();
	const dark = colorScheme === "dark";

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

	const nativeShadow: object = Platform.OS !== "web"
		? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 3, elevation: 2 }
		: {};

	return (
		<Pressable
			onPress={disabled || loading ? undefined : onPress}
			{...(Platform.OS === "web" && !disabled ? { className: "apple-btn" } as any : {})}
			style={({ pressed }) => [
				styles.outer,
				{
					opacity: disabled ? 0.38 : (Platform.OS !== "web" && pressed) ? 0.7 : 1,
				},
				nativeShadow,
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
