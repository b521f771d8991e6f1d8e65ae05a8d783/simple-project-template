import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Pressable, Text, StyleSheet, Platform, Modal } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Constants from "expo-constants";

import { DreamPanel } from "@/components/dream-panel";
import { LANGUAGES } from "@/components/language-selector";
import { Logo } from "@/components/logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { toggleTheme, toggleNavPosition } from "@/redux/state/themeSlice";
import { setLanguage } from "@/redux/state/languageSlice";

type AppMode = "develop" | "dream" | "freeze";

const routeLabels: Record<string, string> = {
	index: "nav.home",
	gallery: "nav.gallery",
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
	const colorScheme = useColorScheme();
	const c = Colors[colorScheme];
	const t = useTranslation();
	const dispatch = useAppDispatch();
	const [menuOpen, setMenuOpen] = useState(false);
	const [langOpen, setLangOpen] = useState(false);
	const reduxLang = useAppSelector((s) => s.language.code);
	const navPosition = useAppSelector((s) => s.theme.navPosition);
	const isBottom = navPosition === "bottom";

	const aboutIndex = state.routes.findIndex((r) => r.name === "about");
	const aboutFocused = state.index === aboutIndex;
	const showDream = appMode === "dream" || appMode === "develop";

	const glassBg = colorScheme === "dark" ? "rgba(45,45,47,0.72)" : "rgba(255,255,255,0.72)";
	const glassBorder = colorScheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
	const glassStyle = {
		backgroundColor: glassBg,
		borderWidth: 1,
		borderColor: glassBorder,
		borderRadius: 980,
		...(Platform.OS === "web" ? { backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" } : {}),
	} as any;

	const positionStyle = Platform.OS === "web"
		? isBottom
			? { position: "fixed" as any, bottom: 0, left: 0, right: 0, zIndex: 100 }
			: { position: "fixed" as any, top: 0, left: 0, right: 0, zIndex: 100 }
		: isBottom
			? { position: "absolute" as const, bottom: 0, left: 0, right: 0, zIndex: 100 }
			: { position: "absolute" as const, top: 0, left: 0, right: 0, zIndex: 100 };

	const menuPositionStyle = isBottom
		? { bottom: 60, right: 16 }
		: { top: 52, right: 16 };

	return (
		<View style={styles.navBarWrapper}>
		<View style={[styles.navBar, positionStyle]}>
			<View style={[styles.glassPill, glassStyle]}>
				<View style={styles.logo}>
					<Logo size={24} color={c.text} />
					<Text style={[styles.appName, { color: c.text }]}>
						{Constants.expoConfig?.name ?? "App"}
					</Text>
				</View>
				{state.routes.map((route, index) => {
					if (hiddenRoutes.has(route.name)) return null;
					const { options } = descriptors[route.key];
					const isFocused = state.index === index;
					const color = isFocused ? c.accent : c.icon;
					const i18nKey = routeLabels[route.name];
					const label = i18nKey ? t(i18nKey as any) : options.title ?? route.name;

					if (!options.tabBarIcon) {
						throw new Error(
							`Tab "${route.name}" is missing a tabBarIcon. All visible tabs must define tabBarIcon in their Tabs.Screen options.`
						);
					}

					return (
						<Pressable
							key={route.key}
							onPress={() => {
								if (!isFocused) navigation.navigate(route.name);
							}}
							style={styles.tab}
						>
							{options.tabBarIcon({ color, focused: isFocused, size: 20 })}
							<Text style={[styles.label, { color }]}>{label}</Text>
						</Pressable>
					);
				})}
			</View>
			<View style={{ flex: 1 }} />
			<View style={[styles.glassPill, glassStyle]}>
				<Pressable onPress={() => setMenuOpen(true)} style={styles.iconBtn}>
					<Text style={{ fontSize: 20, color: c.icon }}>⋮</Text>
				</Pressable>
			</View>

			<Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
				<Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
				<View style={[styles.menu, { backgroundColor: colorScheme === "dark" ? "rgba(45,45,47,0.88)" : "rgba(255,255,255,0.88)", borderColor: c.border, ...(Platform.OS === "web" ? { backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" } : {}) } as any, menuPositionStyle]}>
					{aboutIndex !== -1 && (
						<Pressable
							onPress={() => {
								setMenuOpen(false);
								navigation.navigate("about");
							}}
							style={styles.menuItem}
						>
							<Text style={{ fontSize: 18 }}>ℹ️</Text>
							<Text style={[styles.menuLabel, { color: aboutFocused ? c.accent : c.text }]}>
								{t("nav.explore")}
							</Text>
						</Pressable>
					)}
					<Pressable
						onPress={() => setLangOpen((v) => !v)}
						style={styles.menuItem}
					>
						<Text style={{ fontSize: 18 }}>
							{LANGUAGES.find((l) => l.code === reduxLang)?.flag ?? "🌐"}
						</Text>
						<Text style={[styles.menuLabel, { color: c.text, flex: 1 }]}>
							{t("nav.language")}
						</Text>
						<IconSymbol size={12} name="chevron.right" color={c.icon} />
					</Pressable>
					{langOpen && (
						<View style={[styles.langFlyout, { backgroundColor: colorScheme === "dark" ? "rgba(45,45,47,0.88)" : "rgba(255,255,255,0.88)", borderColor: c.border, ...(Platform.OS === "web" ? { backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" } : {}) } as any]}>
							{LANGUAGES.map((lang) => (
								<Pressable
									key={lang.code}
									onPress={() => {
										dispatch(setLanguage(lang.code));
										setLangOpen(false);
									}}
									style={[
										styles.subMenuItem,
										lang.code === reduxLang && { backgroundColor: c.accent + "18" },
									]}
								>
									<Text style={{ fontSize: 16 }}>{lang.flag}</Text>
									<Text style={[
										styles.menuLabel,
										{ color: lang.code === reduxLang ? c.accent : c.text },
									]}>
										{lang.name}
									</Text>
								</Pressable>
							))}
						</View>
					)}
					<Pressable
						onPress={() => dispatch(toggleTheme())}
						style={styles.menuItem}
					>
						<Text style={{ fontSize: 18 }}>{colorScheme === "dark" ? "☀️" : "🌙"}</Text>
						<Text style={[styles.menuLabel, { color: c.text }]}>
							{colorScheme === "dark" ? "Light Mode" : "Dark Mode"}
						</Text>
					</Pressable>
					<Pressable
						onPress={() => dispatch(toggleNavPosition())}
						style={styles.menuItem}
					>
						<Text style={{ fontSize: 18 }}>{isBottom ? "⬆" : "⬇"}</Text>
						<Text style={[styles.menuLabel, { color: c.text }]}>
							{isBottom ? "Move to Top" : "Move to Bottom"}
						</Text>
					</Pressable>
					{showDream && (
						<Pressable
							onPress={() => {
								setMenuOpen(false);
								onDreamPress();
							}}
							style={styles.menuItem}
						>
							<IconSymbol size={22} name="sparkles" color={dreamOpen ? "#f59e0b" : "#d4a017"} />
							<Text style={[styles.menuLabel, { color: c.text }]}>Dream Mode</Text>
						</Pressable>
					)}
				</View>
			</Modal>
		</View>
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
					name="gallery"
					options={{
						title: "Gallery",
						tabBarIcon: ({ color, size }) => (
							<IconSymbol size={size} name="photo.on.rectangle" color={color} />
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
	navBarWrapper: {
		height: 0,
		overflow: "visible",
		zIndex: 100,
	},
	navBar: {
		flexDirection: "row",
		alignItems: "center",
		height: 56,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	glassPill: {
		flexDirection: "row",
		alignItems: "center",
		height: 40,
		paddingHorizontal: 4,
	},
	logo: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		gap: 8,
	},
	appName: {
		fontSize: 15,
		fontWeight: "600",
	},
	tab: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		gap: 6,
		height: "100%",
	},
	iconBtn: {
		paddingHorizontal: 10,
		justifyContent: "center",
		height: "100%",
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
	},
	menu: {
		position: "absolute",
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		paddingVertical: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		minWidth: 180,
	},
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 10,
		gap: 10,
	},
	menuLabel: {
		fontSize: 14,
		fontWeight: "500",
	},
	langFlyout: {
		position: "absolute",
		right: "100%",
		top: 0,
		marginRight: 6,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		paddingVertical: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		minWidth: 160,
	},
	subMenuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 7,
		gap: 8,
		borderRadius: 6,
		marginHorizontal: 4,
	},
});
