import type { Database } from "./db";

// Minimal D1 types — subset of @cloudflare/workers-types used here.
interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    run(): Promise<{ success: boolean }>;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{ results: T[] }>;
}

export interface D1Database {
    exec(query: string): Promise<{ count: number }>;
    prepare(query: string): D1PreparedStatement;
}

export function createD1Database(d1: D1Database): Database {
    return {
        exec: async (sql) => {
            await d1.exec(sql);
        },
        prepare: <T>(sql: string) => {
            return {
                run: async (...params) => {
                    await d1.prepare(sql).bind(...params).run();
                },
                get: async (...params) => {
                    return (await d1.prepare(sql).bind(...params).first<T>()) ?? undefined;
                },
                all: async (...params) => {
                    const result = await d1.prepare(sql).bind(...params).all<T>();
                    return result.results;
                },
            };
        },
        close: () => {
            // D1 connections are managed by the Workers runtime — nothing to close.
        },
    };
}
