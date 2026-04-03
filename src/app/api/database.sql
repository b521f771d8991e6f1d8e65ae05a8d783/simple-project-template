CREATE TABLE IF NOT EXISTS jobs (
	id             TEXT    PRIMARY KEY,
	status         TEXT    NOT NULL DEFAULT 'running',
	logs           TEXT    NOT NULL DEFAULT '[]',
	cursor         INTEGER NOT NULL DEFAULT 0,
	summary        TEXT,
	has_changes    INTEGER,
	preview_url    TEXT,
	clone_dir      TEXT,
	dev_server_pid INTEGER,
	error          TEXT,
	created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
	finished_at    INTEGER
);

