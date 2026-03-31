import fs from "node:fs";
import path from "node:path";
import sqlite from "node:sqlite";

import type { Database } from "./db";

export function getDatabaseLocation(): string {
    return path.resolve(process.cwd(), "data.db");
}

export function createDatabase(): Database {
    const dbPath = getDatabaseLocation();
    const isNew = !fs.existsSync(dbPath);
    const db = new sqlite.DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
    db.exec("PRAGMA foreign_keys = ON;");

    if (isNew) {
        const schemaPath = path.resolve(process.cwd(), "database.sql");
        const schema = fs.readFileSync(schemaPath, "utf-8");
        db.exec(schema);
    }

    return {
        exec: (sql) => Promise.resolve(db.exec(sql)),
        prepare: <T>(sql: string) => {
            const stmt = db.prepare(sql);
            type P = Parameters<typeof stmt.run>;
            return {
                run: (...params) => Promise.resolve(void stmt.run(...(params as P))),
                get: (...params) => Promise.resolve(stmt.get(...(params as P)) as T | undefined),
                all: (...params) => Promise.resolve(stmt.all(...(params as P)) as T[]),
            };
        },
        close: () => db.close(),
    };
}
