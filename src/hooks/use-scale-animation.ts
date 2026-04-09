import { useRef, useCallback } from "react";
import { Animated, Platform } from "react-native";

/**
 * Returns an Animated scale value and mouse/press handlers.
 * Replaces CSS :hover / :active / transition for interactive elements.
 */
export function useScaleAnimation(hoverScale = 1.01, pressScale = 0.97) {
	const scale = useRef(new Animated.Value(1)).current;

	const spring = useCallback(
		(toValue: number) => {
			Animated.spring(scale, {
				toValue,
				useNativeDriver: true,
				tension: 250,
				friction: 18,
			}).start();
		},
		[scale],
	);

	const hoverHandlers = Platform.OS === "web"
		? { onMouseEnter: () => spring(hoverScale), onMouseLeave: () => spring(1) }
		: {};

	const pressHandlers = {
		onPressIn:  () => spring(pressScale),
		onPressOut: () => spring(1),
	};

	return { scale, hoverHandlers, pressHandlers };
}
