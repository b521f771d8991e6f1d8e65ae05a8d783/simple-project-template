import React, { useState, useRef, useEffect, useCallback } from "react";
import { ScrollView, TextInput, Pressable, View, Text, StyleSheet, ActivityIndicator, Platform, Modal, PanResponder, Dimensions } from "react-native";
import Markdown from "react-native-markdown-display";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { saveMessage, loadMessages, clearHistory, type DreamMessage } from "@/lib/dream-history";
import { useTranslation } from "@/lib/i18n";

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
	const [messages, setMessages] = useState<DreamMessage[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [pos, setPos] = useState({ x: Dimensions.get("window").width - 396, y: 56 });
	const dragOffset = useRef({ x: 0, y: 0 });
	const scrollRef = useRef<ScrollView>(null);

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onPanResponderGrant: (_, gesture) => {
				dragOffset.current = { x: pos.x - gesture.x0, y: pos.y - gesture.y0 };
			},
			onPanResponderMove: (_, gesture) => {
				setPos({
					x: gesture.moveX + dragOffset.current.x,
					y: gesture.moveY + dragOffset.current.y,
				});
			},
		}),
	).current;

	// Reload history from DB every time the panel opens (survives hot reloads)
	const reload = useCallback(async () => {
		console.log("[Dream] Reloading chat history...");
		try {
			const saved = await loadMessages();
			console.log(`[Dream] Loaded ${saved.length} messages from DB`);
			setMessages(saved);
			const lastWithSession = [...saved].reverse().find((m) => m.sessionId);
			if (lastWithSession?.sessionId) {
				console.log(`[Dream] Restored session: ${lastWithSession.sessionId}`);
				setSessionId(lastWithSession.sessionId);
			}
		} catch (err) {
			console.error("[Dream] Failed to load history:", err);
		}
		setInitialized(true);
	}, []);

	useEffect(() => {
		console.log(`[Dream] Panel visible=${visible}`);
		if (visible) reload();
	}, [visible, reload]);

	const scrollToEnd = useCallback(
		() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100),
		[],
	);

	// Scroll to bottom when messages change
	useEffect(() => {
		if (messages.length > 0) scrollToEnd();
	}, [messages.length, scrollToEnd]);

	const [status, setStatus] = useState<string | null>(null);

	const send = async () => {
		const prompt = input.trim();
		if (!prompt || loading) return;

		console.log(`[Dream] Sending: "${prompt.slice(0, 80)}"`);
		const userMsg: DreamMessage = { role: "user", content: prompt };
		const userId = await saveMessage(userMsg).catch(() => undefined);
		setMessages((prev) => [...prev, { ...userMsg, id: userId }]);
		setInput("");
		setLoading(true);
		setStatus("Thinking...");

		try {
			let screenshot: string | undefined;
			if (Platform.OS === "web" && typeof document !== "undefined") {
				try {
					const { default: html2canvas } = await import("html2canvas");
					const canvas = await html2canvas(document.body, { scale: 0.5, logging: false });
					screenshot = canvas.toDataURL("image/png");
				} catch { /* optional */ }
			}

			// Start the job
			const startRes = await dreamFetch({ prompt, sessionId, screenshot });
			if (startRes.error) throw new Error(startRes.error);
			const jobId = startRes.jobId;
			console.log(`[Dream] Job started: ${jobId}`);

			// Poll until done
			let result: any = null;
			while (true) {
				await new Promise((r) => setTimeout(r, 1000));
				const poll = await dreamFetch({ pollJobId: jobId });

				// Show latest log line as status
				if (poll.logs?.length) {
					const lastLog = poll.logs[poll.logs.length - 1];
					setStatus(lastLog);
					for (const log of poll.logs) console.log(`[Dream] ${log}`);
				}

				if (poll.status === "done" || poll.status === "error") {
					result = poll;
					break;
				}
			}

			if (result.status === "error") throw new Error(result.error ?? "Unknown error");
			if (result.sessionId) setSessionId(result.sessionId);

			const finalText = (result.summary ?? "Done.").replace(/\n{3,}/g, "\n\n").trim();
			const assistantMsg: DreamMessage = { role: "assistant", content: finalText, hasChanges: result.hasChanges };
			const aId = await saveMessage({ ...assistantMsg, sessionId: result.sessionId }).catch(() => undefined);
			setMessages((prev) => [...prev, { ...assistantMsg, id: aId }]);

		} catch (err) {
			const errMsg: DreamMessage = { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "unknown"}` };
			const errId = await saveMessage(errMsg).catch(() => undefined);
			setMessages((prev) => [...prev, { ...errMsg, id: errId }]);
		} finally {
			setLoading(false);
			setStatus(null);
		}
	};

	const handleClear = async () => {
		await clearHistory().catch(() => {});
		setMessages([]);
		setSessionId(null);
	};

	if (!visible) return null;

	return (
		<Modal visible transparent animationType="fade" onRequestClose={onClose}>
			<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

			<Pressable style={[styles.panel, { backgroundColor: c.background, borderColor: c.border, top: pos.y, left: pos.x, right: undefined }]} onPress={(e) => e.stopPropagation()}>
				{/* Header — drag handle */}
				<View style={[styles.header, { borderBottomColor: c.border, cursor: "grab" } as any]} {...panResponder.panHandlers}>
					<Text style={[styles.headerTitle, { color: c.text }]}>{t("dream.title")}</Text>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
						{messages.length > 0 && (
							<Pressable onPress={handleClear} hitSlop={8}>
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
					{initialized && messages.length === 0 && (
						<Text style={{ color: c.textSecondary, fontSize: 13, textAlign: "center", paddingVertical: 24 }}>
							{t("dream.empty")}
						</Text>
					)}

					{messages.map((msg) => (
						<View key={msg.id ?? `${msg.role}-${msg.content.slice(0, 20)}`}>
							<View
								style={[
									styles.bubble,
									msg.role === "user"
										? { alignSelf: "flex-end", backgroundColor: c.accent }
										: { alignSelf: "flex-start", backgroundColor: isDark ? "#242424" : "#f0f0f0" },
								]}
							>
								{msg.role === "user" ? (
									<Text style={{ color: "#fff", fontSize: 13 }}>{msg.content}</Text>
								) : (
									<Markdown style={{
										body: { color: c.text, fontSize: 13 },
										code_inline: { backgroundColor: isDark ? "#333" : "#e0e0e0", color: c.text, fontSize: 12 },
										fence: { backgroundColor: isDark ? "#333" : "#e0e0e0", color: c.text, fontSize: 11, padding: 8, borderRadius: 6 },
										link: { color: c.accent },
									}}>
										{msg.content}
									</Markdown>
								)}
								{msg.createdAt && (
									<Text style={{ color: msg.role === "user" ? "rgba(255,255,255,0.5)" : c.textSecondary, fontSize: 10, marginTop: 4 }}>
										{new Date(msg.createdAt).toLocaleTimeString()}
									</Text>
								)}
							</View>
						</View>
					))}

					{loading && (
						<View style={[styles.bubble, { alignSelf: "flex-start", backgroundColor: isDark ? "#242424" : "#f0f0f0", gap: 6 }]}>
							<ActivityIndicator size="small" color={c.accent} />
							{status && (
								<Text style={{ color: c.textSecondary, fontSize: 11, fontFamily: Platform.OS === "web" ? "monospace" : "Courier" }}>
									{status}
								</Text>
							)}
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
						style={[styles.input, { color: c.text, backgroundColor: isDark ? "#2c2c2e" : "#f5f5f5" }]}
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
	panel: {
		position: "absolute",
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
