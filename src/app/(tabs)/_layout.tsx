import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Pressable, Text, StyleSheet, Platform, useColorScheme as useRNColorScheme } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { DreamPanel } from "@/components/dream-panel";
import { Logo } from "@/components/logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { APP_VERSION } from "@/lib/version";
import { Colors } from "@/constants/theme";

type AppMode = "develop" | "dream" | "freeze";

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

	return (
		<View style={[styles.navBar, { backgroundColor: c.background, borderBottomColor: c.border }]}>
			<View style={styles.logo}>
				<Logo size={24} color={c.text} />
			</View>
			<View style={styles.tabs}>
				{state.routes.map((route, index) => {
					const { options } = descriptors[route.key];
					const isFocused = state.index === index;
					const color = isFocused ? c.accent : c.icon;

					return (
						<Pressable
							key={route.key}
							onPress={() => {
								if (!isFocused) navigation.navigate(route.name);
							}}
							style={styles.tab}
						>
							{options.tabBarIcon?.({ color, focused: isFocused, size: 20 })}
							<Text style={[styles.label, { color }]}>{options.title ?? route.name}</Text>
						</Pressable>
					);
				})}
			</View>
			<View style={styles.right}>
				<Text style={[styles.meta, { color: c.textSecondary }]}>v{APP_VERSION}</Text>
			</View>
			{(appMode === "dream" || appMode === "develop") && (
				<Pressable onPress={onDreamPress} style={styles.tab}>
					<IconSymbol size={20} name="sparkles" color={dreamOpen ? c.accent : c.icon} />
					<Text style={[styles.label, { color: dreamOpen ? c.accent : c.icon }]}>Dream</Text>
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
					name="explore"
					options={{
						title: "Explore",
						tabBarIcon: ({ color, size }) => (
							<IconSymbol size={size} name="paperplane.fill" color={color} />
						),
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
	meta: {
		fontSize: 12,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
	},
});
