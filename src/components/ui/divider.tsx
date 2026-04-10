import { View, StyleSheet } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

interface DividerProps {
	inset?: number;
}

export function Divider({ inset = 16 }: DividerProps) {
	const c = useThemeColors();

	return (
		<View
			style={[
				styles.line,
				{
					marginHorizontal: inset,
					backgroundColor: c.border,
					opacity: 0.5,
				},
			]}
		/>
	);
}

const styles = StyleSheet.create({
	line: {
		height: StyleSheet.hairlineWidth,
	},
});
