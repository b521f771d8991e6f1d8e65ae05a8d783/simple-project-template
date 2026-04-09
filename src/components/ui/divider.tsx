import { View, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

interface DividerProps {
	inset?: number;
}

export function Divider({ inset = 16 }: DividerProps) {
	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];

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
