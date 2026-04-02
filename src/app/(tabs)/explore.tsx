import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SleepingDino } from "@/components/sleeping-dino";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/lib/i18n";

export default function ExploreScreen() {
	const colorScheme = useColorScheme();
	const t = useTranslation();

	return (
		<ThemedView className="flex-1">
			<SafeAreaView className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-6 py-8 gap-8 max-w-xl self-center w-full items-center"
				>
					<ThemedText type="title">{t("explore.title")}</ThemedText>
					<SleepingDino dark={colorScheme === "dark"} />

					<ThemedView
						className="rounded-2xl p-4 gap-2 w-full"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">{t("explore.routing")}</ThemedText>
						<ThemedText>{t("explore.routingDesc")}</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2 w-full"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">{t("explore.crossPlatform")}</ThemedText>
						<ThemedText>{t("explore.crossPlatformDesc")}</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2 w-full"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">{t("explore.theme")}</ThemedText>
						<ThemedText>{t("explore.themeDesc")}</ThemedText>
					</ThemedView>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}
