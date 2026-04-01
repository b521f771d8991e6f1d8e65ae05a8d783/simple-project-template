import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ExploreScreen() {
	return (
		<ThemedView className="flex-1">
			<SafeAreaView className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-6 py-8 gap-8 max-w-xl self-center w-full"
				>
					<ThemedText type="title">Explore</ThemedText>

					<ThemedView
						className="rounded-2xl p-4 gap-2"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">File-based routing</ThemedText>
						<ThemedText>
							Screens live in{" "}
							<ThemedText type="semibold">src/app/</ThemedText>.
							Each file becomes a route automatically via Expo
							Router.
						</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">Cross-platform</ThemedText>
						<ThemedText>
							This app runs on iOS, Android, and the web from a
							single codebase using React Native and Expo.
						</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">Rust interop</ThemedText>
						<ThemedText>
							Business logic is written in Rust and compiled to
							WASM for web, or linked natively on mobile. See{" "}
							<ThemedText type="semibold">src/lib/rust.ts</ThemedText>{" "}
							for the bridge.
						</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">Light and dark mode</ThemedText>
						<ThemedText>
							The app adapts to the system color scheme
							automatically. Colors are defined in{" "}
							<ThemedText type="semibold">
								src/constants/theme.ts
							</ThemedText>
							.
						</ThemedText>
					</ThemedView>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}
