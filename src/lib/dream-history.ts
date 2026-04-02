import * as SQLite from "expo-sqlite";

export interface DreamMessage {
	id?: number;
	role: "user" | "assistant";
	content: string;
	hasChanges?: boolean;
	sessionId?: string;
	createdAt?: string;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
	if (!db) {
		db = await SQLite.openDatabaseAsync("dream-history");
		await db.execAsync(`
			CREATE TABLE IF NOT EXISTS messages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				role TEXT NOT NULL,
				content TEXT NOT NULL,
				hasChanges INTEGER DEFAULT 0,
				sessionId TEXT,
				createdAt TEXT DEFAULT (datetime('now'))
			);
		`);
	}
	return db;
}

export async function saveMessage(msg: DreamMessage): Promise<number> {
	const d = await getDb();
	const result = await d.runAsync(
		"INSERT INTO messages (role, content, hasChanges, sessionId) VALUES (?, ?, ?, ?)",
		msg.role,
		msg.content,
		msg.hasChanges ? 1 : 0,
		msg.sessionId ?? null,
	);
	return result.lastInsertRowId;
}

export async function updateMessage(id: number, updates: Partial<DreamMessage>): Promise<void> {
	const d = await getDb();
	if (updates.content !== undefined) {
		await d.runAsync("UPDATE messages SET content = ? WHERE id = ?", updates.content, id);
	}
	if (updates.hasChanges !== undefined) {
		await d.runAsync("UPDATE messages SET hasChanges = ? WHERE id = ?", updates.hasChanges ? 1 : 0, id);
	}
}

export async function loadMessages(): Promise<DreamMessage[]> {
	const d = await getDb();
	const rows = await d.getAllAsync<{
		id: number;
		role: string;
		content: string;
		hasChanges: number;
		sessionId: string | null;
		createdAt: string;
	}>("SELECT * FROM messages ORDER BY id ASC");

	return rows.map((r) => ({
		id: r.id,
		role: r.role as "user" | "assistant",
		content: r.content,
		hasChanges: r.hasChanges === 1,
		sessionId: r.sessionId ?? undefined,
		createdAt: r.createdAt,
	}));
}

export async function clearHistory(): Promise<void> {
	const d = await getDb();
	await d.runAsync("DELETE FROM messages");
}
