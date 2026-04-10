import { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { Animated, View, Pressable, Text, StyleSheet, Platform, Modal } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Constants from "expo-constants";
import { useScaleAnimation } from "@/hooks/use-scale-animation";

import { LiquidGlass } from "@/components/ui/liquid-glass";
import { DreamPanel } from "@/components/dream-panel";
import { APP_VERSION } from "@/lib/version";
import { LANGUAGES } from "@/components/language-selector";
import { Logo } from "@/components/logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { toggleNavPosition, setThemeMode } from "@/redux/state/themeSlice";
import { setLanguage } from "@/redux/state/languageSlice";
import { setBackgroundPattern, setBackgroundColor } from "@/redux/state/backgroundSlice";

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
	const c = useThemeColors();
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

	const { scale: scaleWide, hoverHandlers: hoverWide } = useScaleAnimation(1.01, 1);
	const { scale: scaleSm,   hoverHandlers: hoverSm   } = useScaleAnimation(1.01, 1);

	return (
		<View style={styles.navBarWrapper}>
		<View style={[styles.navBar, positionStyle]}>
			<Animated.View
				style={[styles.glassPill, glassStyle, { transform: [{ scale: scaleWide }] }]}
				{...(hoverWide as any)}
			>
				<View style={styles.logo}>
					<Logo size={24} color={c.text} />
					<View style={{ gap: 0 }}>
						<Text style={[styles.appName, { color: c.text }]}>
							{Constants.expoConfig?.name ?? "App"}
						</Text>
						<Text style={[styles.appVersion, { color: c.textSecondary }]}>
							v{APP_VERSION}
						</Text>
					</View>
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
							accessibilityRole="tab"
							accessibilityLabel={label}
							accessibilityState={{ selected: isFocused }}
						>
							{options.tabBarIcon({ color, focused: isFocused, size: 20 })}
							<Text style={[styles.label, { color }]}>{label}</Text>
						</Pressable>
					);
				})}
			</Animated.View>
			<View style={{ flex: 1 }} />
			<Animated.View
				style={[styles.glassPill, glassStyle, { transform: [{ scale: scaleSm }] }]}
				{...(hoverSm as any)}
			>
				<Pressable
					onPress={() => setMenuOpen(true)}
					style={styles.iconBtn}
					accessibilityRole="button"
					accessibilityLabel="More options"
					accessibilityState={{ expanded: menuOpen }}
				>
					<Text style={{ fontSize: 20, color: c.icon }}>⋮</Text>
				</Pressable>
			</Animated.View>

			<Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
				<Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
				<LiquidGlass radius={14} padding={0} style={[styles.menu, menuPositionStyle]}>
					{aboutIndex !== -1 && (
						<Pressable
							onPress={() => {
								setMenuOpen(false);
								navigation.navigate("about");
							}}
							style={styles.menuItem}
							accessibilityRole="menuitem"
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
						accessibilityRole="menuitem"
						accessibilityState={{ expanded: langOpen }}
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
						<LiquidGlass radius={14} padding={0} style={styles.langFlyout}>
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
						</LiquidGlass>
					)}
					<Pressable
						onPress={() => {
							if (colorScheme === "dark") {
								dispatch(setThemeMode("light"));
								dispatch(setBackgroundPattern("circuit"));
								dispatch(setBackgroundColor("#f5f5f7"));
							} else {
								dispatch(setThemeMode("dark"));
								dispatch(setBackgroundPattern("circuit"));
								dispatch(setBackgroundColor("#4a4a52"));
							}
						}}
						style={styles.menuItem}
						accessibilityRole="menuitem"
					>
						<Text style={{ fontSize: 18 }}>{colorScheme === "dark" ? "☀️" : "🌙"}</Text>
						<Text style={[styles.menuLabel, { color: c.text }]}>
							{colorScheme === "dark" ? "Light Mode" : "Dark Mode"}
						</Text>
					</Pressable>
					<Pressable
						onPress={() => dispatch(toggleNavPosition())}
						style={styles.menuItem}
						accessibilityRole="menuitem"
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
							accessibilityRole="menuitem"
						>
							<IconSymbol size={22} name="sparkles" color={dreamOpen ? "#f59e0b" : "#d4a017"} />
							<Text style={[styles.menuLabel, { color: c.text }]}>{t("dream.title")}</Text>
						</Pressable>
					)}
				</LiquidGlass>
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
				screenOptions={{ headerShown: false, tabBarPosition: "top", animation: "none", unmountOnBlur: true }}
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
		height: 64,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	glassPill: {
		flexDirection: "row",
		alignItems: "center",
		height: 48,
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
	appVersion: {
		fontSize: 10,
		fontWeight: "400",
		opacity: 0.55,
	},
	tab: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		gap: 6,
		height: "100%",
	},
	iconBtn: {
		paddingHorizontal: 12,
		minWidth: 44,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
	},
	menu: {
		position: "absolute",
		paddingVertical: 4,
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
		paddingVertical: 4,
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
