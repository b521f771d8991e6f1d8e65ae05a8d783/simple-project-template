import { useEffect } from "react";
import { Pressable, View, StyleSheet, Platform } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

function injectCSS() {
	if (Platform.OS !== "web" || typeof document === "undefined") return;
	const id = "toggle-css";
	if (document.getElementById(id)) return;
	const s = document.createElement("style");
	s.id = id;
	s.textContent = [
		".apple-toggle{cursor:pointer;-webkit-user-select:none;user-select:none}",
		".apple-toggle .toggle-knob{transition:transform .2s cubic-bezier(.34,1.3,.64,1)!important}",
		".apple-toggle .toggle-track{transition:background-color .2s ease!important}",
	].join("");
	document.head.appendChild(s);
}

export interface ToggleProps {
	value: boolean;
	onValueChange?: (value: boolean) => void;
	disabled?: boolean;
}

export function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
	useEffect(() => injectCSS(), []);

	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];
	const dark = colorScheme === "dark";

	const trackColor = value
		? (dark ? "#2997ff" : "#0071e3")
		: (dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.09)");

	return (
		<Pressable
			onPress={disabled ? undefined : () => onValueChange?.(!value)}
			{...(Platform.OS === "web" ? { className: "apple-toggle" } as any : {})}
			style={{ opacity: disabled ? 0.38 : 1 }}
		>
			<View
				{...(Platform.OS === "web" ? { className: "toggle-track" } as any : {})}
				style={[styles.track, { backgroundColor: trackColor }]}
			>
				<View
					{...(Platform.OS === "web" ? { className: "toggle-knob" } as any : {})}
					style={[
						styles.knob,
						{
							transform: [{ translateX: value ? 16 : 0 }],
						},
						Platform.OS === "web"
							? { boxShadow: "0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.10)" } as any
							: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
					]}
				/>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	track: {
		width: 40,
		height: 24,
		borderRadius: 12,
		padding: 2,
		justifyContent: "center",
	},
	knob: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: "#fff",
	},
});
