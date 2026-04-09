import { useEffect } from "react";
import { Pressable, View, StyleSheet, Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

function injectCSS() {
	if (Platform.OS !== "web" || typeof document === "undefined") return;
	const id = "checkbox-css";
	if (document.getElementById(id)) return;
	const s = document.createElement("style");
	s.id = id;
	s.textContent = [
		".apple-checkbox{cursor:pointer;-webkit-user-select:none;user-select:none;transition:transform .15s ease!important}",
		".apple-checkbox:hover{transform:scale(1.08)!important}",
		".apple-checkbox:active{transform:scale(.92)!important;transition-duration:.06s!important}",
	].join("");
	document.head.appendChild(s);
}

export interface CheckboxProps {
	checked: boolean;
	onValueChange?: (checked: boolean) => void;
	disabled?: boolean;
}

export function Checkbox({ checked, onValueChange, disabled = false }: CheckboxProps) {
	useEffect(() => injectCSS(), []);

	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];
	const dark = colorScheme === "dark";

	const bgColor = checked
		? (dark ? "#2997ff" : "#0071e3")
		: "transparent";

	const borderColor = checked
		? "transparent"
		: (dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.20)");

	return (
		<Pressable
			onPress={disabled ? undefined : () => onValueChange?.(!checked)}
			{...(Platform.OS === "web" && !disabled ? { className: "apple-checkbox" } as any : {})}
			style={{ opacity: disabled ? 0.38 : 1 }}
		>
			<View style={[styles.box, { backgroundColor: bgColor, borderColor }]}>
				{checked && (
					<Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
						<Path
							d="M3 7.5L5.5 10L11 4"
							stroke="#fff"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>
				)}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	box: {
		width: 24,
		height: 24,
		borderRadius: 7,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
});
