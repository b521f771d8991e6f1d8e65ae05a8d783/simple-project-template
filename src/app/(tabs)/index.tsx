import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReadingDino } from "@/components/reading-dino";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function HomeScreen() {
	const colorScheme = useColorScheme();

	return (
		<ThemedView className="flex-1">
			<SafeAreaView className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-6 py-8 gap-8 max-w-xl self-center w-full items-center"
				>
					<ThemedText type="title">Welcome</ThemedText>
					<ReadingDino dark={colorScheme === "dark"} />

					<ThemedView
						className="rounded-2xl p-4 gap-2 w-full"
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
