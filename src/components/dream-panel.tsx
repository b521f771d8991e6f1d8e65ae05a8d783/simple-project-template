import React, { useState, useRef, useEffect, useCallback } from "react";
import { ScrollView, TextInput, Pressable, View, Text, StyleSheet, ActivityIndicator, Platform, Modal, PanResponder, Dimensions } from "react-native";
import Markdown from "react-native-markdown-display";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { saveMessage, loadMessages, clearHistory, type DreamMessage } from "@/lib/dream-history";
import { useTranslation } from "@/lib/i18n";
import { Popup } from "@/components/popup";

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

	// Track pending preview jobs: jobId → previewUrl
	const [pendingPreview, setPendingPreview] = useState<{ jobId: string; previewUrl: string; summary: string } | null>(null);
	const [showPreviewPopup, setShowPreviewPopup] = useState(false);

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

	// Reload history from DB every time the panel opens
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
		setStatus("Cloning repository...");

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

			// Poll until preview or done (max 5 minutes for clone + claude)
			let result: any = null;
			const deadline = Date.now() + 300_000;
			while (Date.now() < deadline) {
				await new Promise((r) => setTimeout(r, 1500));
				let poll: any;
				try {
					poll = await dreamFetch({ pollJobId: jobId });
				} catch (err) {
					console.error("[Dream] Poll error:", err);
					continue;
				}

				if (poll.error) throw new Error(poll.error);

				if (poll.logs?.length) {
					const lastLog = poll.logs[poll.logs.length - 1];
					setStatus(lastLog);
					for (const log of poll.logs) console.log(`[Dream] ${log}`);
				}

				if (poll.status === "preview") {
					// Don't finalize yet — show preview UI
					if (poll.sessionId) setSessionId(poll.sessionId);
					setPendingPreview({ jobId, previewUrl: poll.previewUrl, summary: poll.summary ?? "Changes ready for review." });
					setLoading(false);
					setStatus(null);
					return;
				}

				if (poll.status === "done" || poll.status === "error") {
					result = poll;
					break;
				}
			}

			if (!result) throw new Error("Timed out after 5 minutes");
			if (result.status === "error") throw new Error(result.error ?? "Unknown error");
			if (result.sessionId) setSessionId(result.sessionId);

			// No preview needed (no changes made)
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

	const handleAccept = async () => {
		if (!pendingPreview) return;
		setLoading(true);
		setStatus("Sending to developer...");
		const { jobId, summary } = pendingPreview;
		setPendingPreview(null);
		try {
			const res = await dreamFetch({ action: "accept", jobId });
			if (res.error) throw new Error(res.error);
			const finalText = (res.summary ?? summary ?? "Suggestion sent.").replace(/\n{3,}/g, "\n\n").trim();
			const msg: DreamMessage = { role: "assistant", content: finalText, hasChanges: true };
			const id = await saveMessage({ ...msg, sessionId: sessionId ?? undefined }).catch(() => undefined);
			setMessages((prev) => [...prev, { ...msg, id }]);
		} catch (err) {
			const msg: DreamMessage = { role: "assistant", content: `Failed to send: ${err instanceof Error ? err.message : "unknown"}` };
			const id = await saveMessage(msg).catch(() => undefined);
			setMessages((prev) => [...prev, { ...msg, id }]);
		} finally {
			setLoading(false);
			setStatus(null);
		}
	};

	const handleDecline = async () => {
		if (!pendingPreview) return;
		const { jobId } = pendingPreview;
		setPendingPreview(null);
		await dreamFetch({ action: "decline", jobId }).catch(() => {});
		const msg: DreamMessage = { role: "assistant", content: "Changes discarded." };
		const id = await saveMessage(msg).catch(() => undefined);
		setMessages((prev) => [...prev, { ...msg, id }]);
	};

	const handleClear = async () => {
		await clearHistory().catch(() => {});
		setMessages([]);
		setSessionId(null);
		setPendingPreview(null);
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
					{initialized && messages.length === 0 && !pendingPreview && (
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

					{/* Preview — chat bubble with Show Preview / Accept / Decline */}
					{pendingPreview && !loading && (
						<View style={[styles.bubble, { alignSelf: "flex-start", backgroundColor: isDark ? "#242424" : "#f0f0f0" }]}>
							<Text style={{ color: c.text, fontSize: 13, marginBottom: 6 }}>Preview ready.</Text>
							<View style={styles.decisionRow}>
								<Pressable onPress={() => setShowPreviewPopup(true)} style={[styles.decisionBtn, { backgroundColor: c.accent }]}>
									<Text style={styles.decisionBtnText}>Show Preview</Text>
								</Pressable>
								<Pressable onPress={handleAccept} style={[styles.decisionBtn, { backgroundColor: "#22c55e" }]}>
									<Text style={styles.decisionBtnText}>Send to Developer</Text>
								</Pressable>
								<Pressable onPress={handleDecline} style={[styles.decisionBtn, { backgroundColor: isDark ? "#3a3a3a" : "#e5e7eb" }]}>
									<Text style={[styles.decisionBtnText, { color: c.text }]}>Decline</Text>
								</Pressable>
							</View>
						</View>
					)}

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
						editable={!loading && !pendingPreview}
					/>
					<Pressable
						onPress={send}
						disabled={loading || !input.trim() || !!pendingPreview}
						style={[styles.sendBtn, { backgroundColor: c.accent, opacity: loading || !input.trim() || !!pendingPreview ? 0.4 : 1 }]}
					>
						<Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>{t("dream.send")}</Text>
					</Pressable>
				</View>
			</Pressable>

			{/* Preview popup with iframe — only when user clicks Show Preview */}
			{Platform.OS === "web" && pendingPreview && showPreviewPopup && (
				<Popup
					open
					onClose={() => setShowPreviewPopup(false)}
					title="Dream Preview"
					dark={isDark}
					width="80vw"
					maxWidth={1400}
					height="85vh"
					overlay={false}
					zIndex={60}
					actions={[
						{ label: "Send to Developer", onClick: () => { setShowPreviewPopup(false); handleAccept(); } },
						{ label: "Decline", onClick: () => { setShowPreviewPopup(false); handleDecline(); } },
					]}
				>
					<iframe
						src={pendingPreview.previewUrl}
						style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
					/>
				</Popup>
			)}
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
	previewLink: {
		marginTop: 8,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
		gap: 2,
	},
	decisionRow: {
		flexDirection: "row",
		gap: 8,
		marginTop: 8,
	},
	decisionBtn: {
		flex: 1,
		borderRadius: 8,
		paddingVertical: 6,
		alignItems: "center",
	},
	decisionBtnText: {
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
