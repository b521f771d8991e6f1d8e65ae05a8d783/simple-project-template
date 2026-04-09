import { Animated, Pressable, View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScaleAnimation } from "@/hooks/use-scale-animation";

export interface CheckboxProps {
	checked: boolean;
	onValueChange?: (checked: boolean) => void;
	disabled?: boolean;
}

export function Checkbox({ checked, onValueChange, disabled = false }: CheckboxProps) {
	const colorScheme = useColorScheme();
	const dark = colorScheme === "dark";
	const { scale, hoverHandlers, pressHandlers } = useScaleAnimation(1.08, 0.92);

	const bgColor = checked
		? (dark ? "#2997ff" : "#0071e3")
		: "transparent";

	const borderColor = checked
		? "transparent"
		: (dark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.20)");

	return (
		<Animated.View
			style={{ transform: [{ scale }], opacity: disabled ? 0.38 : 1 }}
			{...(hoverHandlers as any)}
		>
			<Pressable
				onPress={disabled ? undefined : () => onValueChange?.(!checked)}
				{...pressHandlers}
				accessibilityRole="checkbox"
				accessibilityState={{ checked, disabled }}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
		</Animated.View>
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
