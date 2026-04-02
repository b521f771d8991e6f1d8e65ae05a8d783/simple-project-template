import { useState, useEffect } from "react";
import { ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { APP_VERSION } from "@/lib/version";

interface InfoRow {
	label: string;
	value: string;
}

function Row({ label, value }: InfoRow) {
	return (
		<ThemedView className="flex-row justify-between py-2 border-b border-gray-200 dark:border-gray-700">
			<ThemedText style={{ opacity: 0.6, fontSize: 13 }}>{label}</ThemedText>
			<ThemedText style={{ fontSize: 13, fontFamily: Platform.OS === "web" ? "monospace" : "Courier" }}>{value}</ThemedText>
		</ThemedView>
	);
}

export default function AboutScreen() {
	const [mode, setMode] = useState("...");

	useEffect(() => {
		const baseUrl = Platform.OS === "web" ? "" : `http://localhost:${process.env.EXPO_PUBLIC_BACKEND_PORT ?? "8081"}`;
		fetch(`${baseUrl}/api/mode`)
			.then((r) => r.json())
			.then((d) => setMode(d.mode))
			.catch(() => setMode("unknown"));
	}, []);

	const expoVersion = Constants.expoConfig?.sdkVersion ?? "unknown";

	return (
		<ThemedView className="flex-1">
			<SafeAreaView className="flex-1">
				<ScrollView
					className="flex-1"
					contentContainerClassName="px-6 py-8 gap-6 max-w-xl self-center w-full"
				>
					<ThemedText type="title">Info</ThemedText>

					<ThemedView
						className="rounded-2xl p-4 w-full"
						lightColor="#f9fafb"
						darkColor="#242424"
					>
						<ThemedText type="subtitle" style={{ marginBottom: 8 }}>Application</ThemedText>
						<Row label="Version" value={APP_VERSION} />
						<Row label="Name" value={Constants.expoConfig?.name ?? "unknown"} />
						<Row label="Mode" value={mode} />
						<Row label="Platform" value={Platform.OS} />
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 w-full"
						lightColor="#f9fafb"
						darkColor="#242424"
					>
						<ThemedText type="subtitle" style={{ marginBottom: 8 }}>Toolchain</ThemedText>
						<Row label="Expo SDK" value={expoVersion} />
						<Row label="Expo Router" value={Constants.expoConfig?.extra?.expoRouterVersion ?? "~6.x"} />
						<Row label="TypeScript" value="~5.9" />
					</ThemedView>

					<ThemedView
						className="rounded-2xl p-4 w-full"
						lightColor="#f9fafb"
						darkColor="#242424"
					>
						<ThemedText type="subtitle" style={{ marginBottom: 8 }}>Infrastructure</ThemedText>
						<Row label="Build System" value="Nix Flakes" />
						<Row label="CI/CD" value="GitHub Actions" />
						<Row label="Hosting" value="Cloudflare Workers / Docker" />
						<Row label="AI Agent" value="Claude Code" />
					</ThemedView>
				</ScrollView>
			</SafeAreaView>
		</ThemedView>
	);
}
