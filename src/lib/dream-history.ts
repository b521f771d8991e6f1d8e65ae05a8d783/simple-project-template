import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DreamMessage {
	id?: number;
	role: "user" | "assistant";
	content: string;
	hasChanges?: boolean;
	sessionId?: string;
	createdAt?: string;
}

const KEY = "dream-chat-history";

export async function loadMessages(): Promise<DreamMessage[]> {
	console.log("[DreamDB] Loading messages...");
	try {
		const raw = await AsyncStorage.getItem(KEY);
		const msgs: DreamMessage[] = raw ? JSON.parse(raw) : [];
		console.log(`[DreamDB] Loaded ${msgs.length} messages`);
		return msgs;
	} catch (err) {
		console.error("[DreamDB] Failed to load:", err);
		return [];
	}
}

async function persist(msgs: DreamMessage[]): Promise<void> {
	await AsyncStorage.setItem(KEY, JSON.stringify(msgs));
}

export async function saveMessage(msg: DreamMessage): Promise<number> {
	const msgs = await loadMessages();
	const id = msgs.reduce((max, m) => Math.max(max, m.id ?? 0), 0) + 1;
	const saved: DreamMessage = { ...msg, id, createdAt: msg.createdAt ?? new Date().toISOString() };
	msgs.push(saved);
	await persist(msgs);
	console.log(`[DreamDB] Saved ${msg.role} id=${id}`);
	return id;
}

export async function updateMessage(id: number, updates: Partial<DreamMessage>): Promise<void> {
	const msgs = await loadMessages();
	const idx = msgs.findIndex((m) => m.id === id);
	if (idx !== -1) {
		msgs[idx] = { ...msgs[idx], ...updates };
		await persist(msgs);
		console.log(`[DreamDB] Updated id=${id}`);
	}
}

export async function clearHistory(): Promise<void> {
	await AsyncStorage.removeItem(KEY);
	console.log("[DreamDB] History cleared");
}
