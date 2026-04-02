import { useState, useRef } from "react";
import { ScrollView, TextInput, Pressable, View, Text, StyleSheet, ActivityIndicator, Platform, Modal } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface Message {
	role: "user" | "assistant";
	content: string;
	operations?: { action: string; path: string; blocked?: boolean }[];
}

interface DreamPanelProps {
	visible: boolean;
	onClose: () => void;
}

export function DreamPanel({ visible, onClose }: DreamPanelProps) {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const c = Colors[colorScheme];
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const scrollRef = useRef<ScrollView>(null);

	const send = async () => {
		const prompt = input.trim();
		if (!prompt || loading) return;

		const userMsg: Message = { role: "user", content: prompt };
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const baseUrl = Platform.OS === "web" ? "" : `http://localhost:${process.env.EXPO_PUBLIC_BACKEND_PORT ?? "8081"}`;
			const res = await fetch(`${baseUrl}/api/dream`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt }),
			});

			const data = await res.json();

			if (!res.ok) {
				setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${data.error}` }]);
			} else {
				setMessages((prev) => [
					...prev,
					{ role: "assistant", content: data.summary, operations: data.operations },
				]);
			}
		} catch (err) {
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: `Connection error: ${err instanceof Error ? err.message : "unknown"}` },
			]);
		} finally {
			setLoading(false);
			setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
		}
	};

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			{/* Backdrop */}
			<Pressable style={styles.backdrop} onPress={onClose} />

			{/* Panel — anchored bottom-right */}
			<View style={[styles.panel, { backgroundColor: c.background, borderColor: c.border }]}>
				{/* Header */}
				<View style={[styles.header, { borderBottomColor: c.border }]}>
					<Text style={[styles.headerTitle, { color: c.text }]}>Dream Mode</Text>
					<Pressable onPress={onClose} hitSlop={8}>
						<Text style={{ color: c.textSecondary, fontSize: 18 }}>✕</Text>
					</Pressable>
				</View>

				{/* Messages */}
				<ScrollView
					ref={scrollRef}
					style={styles.messages}
					contentContainerStyle={styles.messagesContent}
				>
					{messages.length === 0 && (
						<Text style={{ color: c.textSecondary, fontSize: 13, textAlign: "center", paddingVertical: 24 }}>
							Describe what you want to change.{"\n"}The app will modify itself in real-time.
						</Text>
					)}

					{messages.map((msg, i) => (
						<View
							key={i}
							style={[
								styles.bubble,
								msg.role === "user"
									? { alignSelf: "flex-end", backgroundColor: c.accent }
									: { alignSelf: "flex-start", backgroundColor: isDark ? "#1c1c1e" : "#f0f0f0" },
							]}
						>
							<Text style={{ color: msg.role === "user" ? "#fff" : c.text, fontSize: 13 }}>
								{msg.content}
							</Text>
							{msg.operations && msg.operations.length > 0 && (
								<View style={styles.ops}>
									{msg.operations.map((op, j) => (
										<Text key={j} style={{ fontSize: 10, color: op.blocked ? "#ef4444" : c.textSecondary }}>
											{op.blocked ? "blocked" : op.action === "write" ? "~" : "x"} {op.path}
										</Text>
									))}
								</View>
							)}
						</View>
					))}

					{loading && (
						<View style={[styles.bubble, { alignSelf: "flex-start", backgroundColor: isDark ? "#1c1c1e" : "#f0f0f0" }]}>
							<ActivityIndicator size="small" color={c.accent} />
						</View>
					)}
				</ScrollView>

				{/* Input */}
				<View style={[styles.inputRow, { borderTopColor: c.border }]}>
					<TextInput
						value={input}
						onChangeText={setInput}
						placeholder="Describe a change..."
						placeholderTextColor={c.textSecondary}
						style={[styles.input, { color: c.text, backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5" }]}
						multiline
						onSubmitEditing={send}
						editable={!loading}
					/>
					<Pressable
						onPress={send}
						disabled={loading || !input.trim()}
						style={[styles.sendBtn, { backgroundColor: c.accent, opacity: loading || !input.trim() ? 0.4 : 1 }]}
					>
						<Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Send</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.3)",
	},
	panel: {
		position: "absolute",
		top: 56,
		right: 16,
		width: 380,
		maxWidth: "90%",
		height: 480,
		maxHeight: "70%",
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.25,
		shadowRadius: 24,
		elevation: 10,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	headerTitle: {
		fontSize: 14,
		fontWeight: "600",
	},
	messages: {
		flex: 1,
	},
	messagesContent: {
		padding: 12,
		gap: 8,
	},
	bubble: {
		maxWidth: "85%",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	ops: {
		marginTop: 6,
		gap: 2,
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		padding: 10,
		gap: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	input: {
		flex: 1,
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 8,
		fontSize: 13,
		maxHeight: 80,
	},
	sendBtn: {
		borderRadius: 16,
		paddingHorizontal: 14,
		paddingVertical: 8,
	},
});
