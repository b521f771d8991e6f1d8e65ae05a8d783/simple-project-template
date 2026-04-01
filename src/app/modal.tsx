import { Pressable } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ModalScreen() {
	return (
		<ThemedView className="flex-1 items-center justify-center px-6">
			<ThemedText type="title">Modal</ThemedText>
			<Pressable
				className="mt-6 px-6 py-3 rounded-xl bg-[#007aff] active:opacity-70"
				onPress={() => router.dismiss()}
			>
				<ThemedText lightColor="#fff" darkColor="#fff" type="semibold">
					Dismiss
				</ThemedText>
			</Pressable>
		</ThemedView>
	);
}
