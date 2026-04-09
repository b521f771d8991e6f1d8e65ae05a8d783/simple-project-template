import { useRef, useEffect } from "react";
import { Animated, Pressable, StyleSheet, Platform } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScaleAnimation } from "@/hooks/use-scale-animation";

export interface ToggleProps {
	value: boolean;
	onValueChange?: (value: boolean) => void;
	disabled?: boolean;
}

export function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
	const colorScheme = useColorScheme();
	const dark = colorScheme === "dark";

	// Knob slide animation
	const knobX = useRef(new Animated.Value(value ? 16 : 0)).current;
	useEffect(() => {
		Animated.spring(knobX, {
			toValue: value ? 16 : 0,
			useNativeDriver: true,
			tension: 300,
			friction: 20,
		}).start();
	}, [value]);

	const { scale, hoverHandlers } = useScaleAnimation(1.04, 1);

	const trackColor = value
		? (dark ? "#2997ff" : "#0071e3")
		: (dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.09)");

	const knobShadow: object = Platform.OS !== "web"
		? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }
		: { boxShadow: "0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.10)" } as any;

	return (
		<Animated.View
			style={{ transform: [{ scale }], opacity: disabled ? 0.38 : 1 }}
			{...(hoverHandlers as any)}
		>
			<Pressable
				onPress={disabled ? undefined : () => onValueChange?.(!value)}
				accessibilityRole="switch"
				accessibilityState={{ checked: value, disabled }}
				hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
			>
				<Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
					<Animated.View
						style={[
							styles.knob,
							knobShadow,
							{ transform: [{ translateX: knobX }] },
						]}
					/>
				</Animated.View>
			</Pressable>
		</Animated.View>
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
