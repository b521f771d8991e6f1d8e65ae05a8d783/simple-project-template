import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useAppSelector } from "@/redux/store";

/**
 * Returns the current theme color palette, with `accent` (and `tabIconSelected`)
 * replaced by the Redux accent override when a preset has bundled one.
 */
export function useThemeColors() {
	const colorScheme = useColorScheme();
	const base = Colors[colorScheme];
	const accentOverride = useAppSelector((state) => state.background.accentOverride);
	if (!accentOverride) return base;
	return { ...base, accent: accentOverride, tabIconSelected: accentOverride };
}
