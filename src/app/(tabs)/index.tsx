import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { get_1 } from "@/lib/rust";

export default function HomeScreen() {
	return (
		<ThemedView className="flex-1">
			<SafeAreaView className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-6 py-8 gap-8 max-w-xl self-center w-full"
				>
					<ThemedText type="title">Welcome</ThemedText>

					<ThemedView
						className="rounded-2xl p-4 gap-2"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">Rust + WASM</ThemedText>
						<ThemedText>
							Rust says:{" "}
							<ThemedText type="semibold">{get_1()}</ThemedText>
						</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">Get started</ThemedText>
						<ThemedText>
							Edit{" "}
							<ThemedText type="semibold">
								app/(tabs)/index.tsx
							</ThemedText>{" "}
							to start building your app.
						</ThemedText>
					</ThemedView>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}
