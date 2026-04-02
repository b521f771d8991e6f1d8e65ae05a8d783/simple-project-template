import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReadingDino } from "@/components/reading-dino";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/lib/i18n";

export default function HomeScreen() {
	const colorScheme = useColorScheme();
	const t = useTranslation();

	return (
		<ThemedView className="flex-1">
			<SafeAreaView className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-6 py-8 gap-8 max-w-xl self-center w-full items-center"
				>
					<ThemedText type="title">{t("home.title")}</ThemedText>
					<ReadingDino dark={colorScheme === "dark"} />

					<ThemedView
						className="rounded-2xl p-4 gap-2 w-full"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">{t("home.dreamMode")}</ThemedText>
						<ThemedText>{t("home.dreamModeDesc")}</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2 w-full"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">{t("home.editVSCode")}</ThemedText>
						<ThemedText>{t("home.editVSCodeDesc")}</ThemedText>
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 gap-2 w-full"
						lightColor="#f9fafb"
						darkColor="#111"
					>
						<ThemedText type="subtitle">{t("home.release")}</ThemedText>
						<ThemedText>{t("home.releaseDesc")}</ThemedText>
					</ThemedView>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}
