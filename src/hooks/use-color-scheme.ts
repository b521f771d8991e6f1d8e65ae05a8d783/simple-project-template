import { useColorScheme as useRNColorScheme } from "react-native";
import { useAppSelector } from "@/redux/store";

export function useColorScheme(): "light" | "dark" {
	const systemScheme = useRNColorScheme() ?? "light";
	const themeMode = useAppSelector((state) => state.theme.mode);

	if (themeMode === "system") return systemScheme;
	return themeMode;
}
