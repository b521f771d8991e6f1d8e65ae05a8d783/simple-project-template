// Platform-agnostic database interface.
// Use a platform-specific implementation (e.g. db.node.ts, db.d1.ts) to obtain an instance.

export interface PreparedStatement<T = unknown> {
    run(...params: unknown[]): Promise<void>;
    get(...params: unknown[]): Promise<T | undefined>;
    all(...params: unknown[]): Promise<T[]>;
}

export interface Database {
    exec(sql: string): Promise<void>;
    prepare<T = unknown>(sql: string): PreparedStatement<T>;
    close(): void;
}
