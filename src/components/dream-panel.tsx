import React, { useState, useRef, useEffect } from "react";
import { ScrollView, TextInput, Pressable, View, Text, StyleSheet, ActivityIndicator, Platform, Modal } from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { saveMessage, updateMessage, loadMessages, clearHistory } from "@/lib/dream-history";
import { useTranslation } from "@/lib/i18n";

interface Message {
	id?: number;
	role: "user" | "assistant";
	content: string;
	hasChanges?: boolean;
}

interface DreamPanelProps {
	visible: boolean;
	onClose: () => void;
}

const baseUrl = Platform.OS === "web" ? "" : `http://localhost:${process.env.EXPO_PUBLIC_BACKEND_PORT ?? "8081"}`;

async function dreamFetch(body: Record<string, unknown>) {
	const res = await fetch(`${baseUrl}/api/dream`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return res.json();
}

export function DreamPanel({ visible, onClose }: DreamPanelProps) {
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const c = Colors[colorScheme];
	const t = useTranslation();
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const scrollRef = useRef<ScrollView>(null);

	// Reload persisted history every time the panel opens (survives hot reloads)
	useEffect(() => {
		if (!visible) return;
		loadMessages().then((saved) => {
			setMessages(saved);
			const lastWithSession = [...saved].reverse().find((m) => m.sessionId);
			if (lastWithSession?.sessionId) setSessionId(lastWithSession.sessionId);
		}).catch(() => {});
	}, [visible]);

	const scrollToEnd = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

	const send = async () => {
		const prompt = input.trim();
		if (!prompt || loading) return;

		const userMsg: Message = { role: "user", content: prompt };
		const userId = await saveMessage(userMsg).catch(() => undefined);
		setMessages((prev) => [...prev, { ...userMsg, id: userId }]);
		setInput("");
		setLoading(true);

		try {
			// Capture a screenshot of the app for context
			let screenshot: string | undefined;
			if (Platform.OS === "web" && typeof document !== "undefined") {
				try {
					const { default: html2canvas } = await import("html2canvas");
					const canvas = await html2canvas(document.body, { scale: 0.5, logging: false });
					screenshot = canvas.toDataURL("image/png");
				} catch { /* screenshot is optional */ }
			}

			const data = await dreamFetch({ prompt, sessionId, screenshot });
			if (data.sessionId) setSessionId(data.sessionId);

			if (data.error) {
				const errMsg: Message = { role: "assistant", content: `Error: ${data.error}` };
				const errId = await saveMessage(errMsg).catch(() => undefined);
				setMessages((prev) => [...prev, { ...errMsg, id: errId }]);
			} else {
				const assistantMsg: Message = {
					role: "assistant",
					content: data.summary,
					hasChanges: data.hasChanges,
				};
				const aId = await saveMessage({ ...assistantMsg, sessionId: data.sessionId }).catch(() => undefined);
				setMessages((prev) => [...prev, { ...assistantMsg, id: aId }]);
			}
		} catch (err) {
			const errMsg: Message = { role: "assistant", content: `Connection error: ${err instanceof Error ? err.message : "unknown"}` };
			const errId = await saveMessage(errMsg).catch(() => undefined);
			setMessages((prev) => [...prev, { ...errMsg, id: errId }]);
		} finally {
			setLoading(false);
			scrollToEnd();
		}
	};

	const handleAction = async (action: "keep" | "discard", msgIndex: number) => {
		setLoading(true);
		try {
			const data = await dreamFetch({ action });
			setMessages((prev) =>
				prev.map((m, i) => {
					if (i !== msgIndex) return m;
					const updated = { ...m, content: `${m.content}\n\n${data.summary ?? data.error}`, hasChanges: false };
					if (m.id) updateMessage(m.id, { content: updated.content, hasChanges: false }).catch(() => {});
					return updated;
				}),
			);
		} catch (err) {
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: `Error: ${err instanceof Error ? err.message : "unknown"}` },
			]);
		} finally {
			setLoading(false);
			scrollToEnd();
		}
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

			<Pressable style={[styles.panel, { backgroundColor: c.background, borderColor: c.border }]} onPress={(e) => e.stopPropagation()}>
				{/* Header */}
				<View style={[styles.header, { borderBottomColor: c.border }]}>
					<Text style={[styles.headerTitle, { color: c.text }]}>{t("dream.title")}</Text>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
						{messages.length > 0 && (
							<Pressable onPress={() => { clearHistory().catch(() => {}); setMessages([]); setSessionId(null); }} hitSlop={8}>
								<Text style={{ color: c.textSecondary, fontSize: 12 }}>Clear</Text>
							</Pressable>
						)}
						<Pressable onPress={onClose} hitSlop={8}>
							<Text style={{ color: c.textSecondary, fontSize: 18 }}>✕</Text>
						</Pressable>
					</View>
				</View>

				{/* Messages */}
				<ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent}>
					{messages.length === 0 && (
						<Text style={{ color: c.textSecondary, fontSize: 13, textAlign: "center", paddingVertical: 24 }}>
							{t("dream.empty")}
						</Text>
					)}

					{messages.map((msg, i) => (
						<View key={i}>
							<View
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
							</View>
							{/* Keep / Discard buttons */}
							{msg.hasChanges && (
								<View style={styles.branchActions}>
									<Pressable
										onPress={() => handleAction("keep", i)}
										disabled={loading}
										style={[styles.actionBtn, { backgroundColor: "#22c55e" }]}
									>
										<Text style={styles.actionBtnText}>{t("dream.keep")}</Text>
									</Pressable>
									<Pressable
										onPress={() => handleAction("discard", i)}
										disabled={loading}
										style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
									>
										<Text style={styles.actionBtnText}>{t("dream.discard")}</Text>
									</Pressable>
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
						placeholder={t("dream.placeholder")}
						placeholderTextColor={c.textSecondary}
						style={[styles.input, { color: c.text, backgroundColor: isDark ? "#242424" : "#f5f5f5" }]}
						multiline
						onSubmitEditing={send}
						onKeyPress={(e) => {
							if (Platform.OS === "web" && e.nativeEvent.key === "Enter" && !(e as unknown as React.KeyboardEvent).shiftKey) {
								e.preventDefault();
								send();
							}
						}}
						editable={!loading}
					/>
					<Pressable
						onPress={send}
						disabled={loading || !input.trim()}
						style={[styles.sendBtn, { backgroundColor: c.accent, opacity: loading || !input.trim() ? 0.4 : 1 }]}
					>
						<Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>{t("dream.send")}</Text>
					</Pressable>
				</View>
			</Pressable>
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
	branchActions: {
		flexDirection: "row",
		gap: 8,
		marginTop: 6,
		marginLeft: 4,
	},
	actionBtn: {
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 5,
	},
	actionBtnText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
	inputRow: {
		flexDirection: "row",
		alignItems: "center",
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
