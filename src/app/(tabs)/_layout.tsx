import { Tabs } from "expo-router";
import { View, Pressable, Text, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { Logo } from "@/components/logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { APP_VERSION } from "@/lib/version";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function NavBar({ state, descriptors, navigation }: BottomTabBarProps) {
	const colorScheme = useColorScheme() ?? "light";

	return (
		<View style={[styles.navBar, { backgroundColor: Colors[colorScheme].background, borderBottomColor: Colors[colorScheme].border }]}>
			<View style={styles.logo}>
				<Logo size={24} color={Colors[colorScheme].text} />
			</View>
			<View style={styles.tabs}>
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key];
				const isFocused = state.index === index;
				const color = isFocused ? Colors[colorScheme].accent : Colors[colorScheme].icon;

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
				<Text style={[styles.meta, { color: Colors[colorScheme].textSecondary }]}>
					v{APP_VERSION}
				</Text>
			</View>
		</View>
	);
}

export default function TabLayout() {
	const colorScheme = useColorScheme() ?? "light";

	return (
		<Tabs
			screenOptions={{ headerShown: false, tabBarPosition: "top" }}
			tabBar={(props) => <NavBar {...props} />}
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
		paddingHorizontal: 16,
	},
	meta: {
		fontSize: 12,
	},
	version: {
		opacity: 0.6,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
	},
});
