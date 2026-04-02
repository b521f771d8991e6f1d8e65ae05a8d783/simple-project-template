import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Pressable, Text, StyleSheet, Platform, useColorScheme as useRNColorScheme } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { DreamPanel } from "@/components/dream-panel";
import { LanguageSelector } from "@/components/language-selector";
import { Logo } from "@/components/logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";
import { Colors } from "@/constants/theme";

type AppMode = "develop" | "dream" | "freeze";

const routeLabels: Record<string, string> = {
	index: "nav.home",
};

// Routes to hide from the left tab bar (rendered separately on the right)
const hiddenRoutes = new Set(["about"]);

function useAppMode(): AppMode {
	const [mode, setMode] = useState<AppMode>("freeze");

	useEffect(() => {
		const baseUrl = Platform.OS === "web" ? "" : `http://localhost:${process.env.EXPO_PUBLIC_BACKEND_PORT ?? "8081"}`;
		fetch(`${baseUrl}/api/mode`)
			.then((r) => r.json())
			.then((d) => setMode(d.mode))
			.catch(() => setMode("freeze"));
	}, []);

	return mode;
}

function NavBar({
	state, descriptors, navigation, appMode, onDreamPress, dreamOpen,
}: BottomTabBarProps & { appMode: AppMode; onDreamPress: () => void; dreamOpen: boolean }) {
	const colorScheme = useRNColorScheme() ?? "light";
	const c = Colors[colorScheme];
	const t = useTranslation();

	const aboutIndex = state.routes.findIndex((r) => r.name === "about");
	const aboutFocused = state.index === aboutIndex;

	return (
		<View style={[styles.navBar, { backgroundColor: c.background, borderBottomColor: c.border }]}>
			<View style={styles.logo}>
				<Logo size={24} color={c.text} />
			</View>
			<View style={styles.tabs}>
				{state.routes.map((route, index) => {
					if (hiddenRoutes.has(route.name)) return null;
					const { options } = descriptors[route.key];
					const isFocused = state.index === index;
					const color = isFocused ? c.accent : c.icon;
					const i18nKey = routeLabels[route.name];
					const label = i18nKey ? t(i18nKey as any) : options.title ?? route.name;

					return (
						<Pressable
							key={route.key}
							onPress={() => {
								if (!isFocused) navigation.navigate(route.name);
							}}
							style={styles.tab}
						>
							{options.tabBarIcon?.({ color, focused: isFocused, size: 20 })}
							<Text style={[styles.label, { color }]}>{label}</Text>
						</Pressable>
					);
				})}
			</View>
			<View style={styles.right} />
			{aboutIndex !== -1 && (
				<Pressable
					onPress={() => navigation.navigate("about")}
					style={styles.iconBtn}
				>
					<Text style={{ fontSize: 18, color: aboutFocused ? c.accent : c.icon }}>ℹ️</Text>
				</Pressable>
			)}
			<LanguageSelector />
			{(appMode === "dream" || appMode === "develop") && (
				<Pressable onPress={onDreamPress} style={styles.iconBtn}>
					<IconSymbol size={22} name="sparkles" color={dreamOpen ? "#f59e0b" : "#d4a017"} />
				</Pressable>
			)}
		</View>
	);
}

export default function TabLayout() {
	const [dreamOpen, setDreamOpen] = useState(false);
	const appMode = useAppMode();

	return (
		<>
			<Tabs
				screenOptions={{ headerShown: false, tabBarPosition: "top" }}
				tabBar={(props) => (
					<NavBar
						{...props}
						appMode={appMode}
						onDreamPress={() => setDreamOpen((v) => !v)}
						dreamOpen={dreamOpen}
					/>
				)}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Home",
						tabBarIcon: ({ color, size }) => (
							<IconSymbol size={size} name="house.fill" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="about"
					options={{
						title: "About",
					}}
				/>
			</Tabs>
			{(appMode === "dream" || appMode === "develop") && (
				<DreamPanel visible={dreamOpen} onClose={() => setDreamOpen(false)} />
			)}
		</>
	);
}

const styles = StyleSheet.create({
	navBar: {
		flexDirection: "row",
		alignItems: "center",
		height: 48,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	logo: {
		paddingHorizontal: 16,
	},
	tab: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		gap: 6,
		height: "100%",
	},
	tabs: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	right: {
		paddingRight: 8,
	},
	iconBtn: {
		paddingHorizontal: 8,
		justifyContent: "center",
		height: "100%",
	},
	meta: {
		fontSize: 12,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
	},
});
