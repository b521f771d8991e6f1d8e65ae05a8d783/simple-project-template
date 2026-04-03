import { spawn, execFile } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import * as net from "net";
import { DatabaseSync as Database } from "node:sqlite";
import { deferTask } from "expo-server";

const exec = promisify(execFile);

let systemPrompt: string;
try {
	systemPrompt = readFileSync(join(process.cwd(), "src/app/api/dream-system-prompt.txt"), "utf-8");
} catch {
	systemPrompt = "You are Dream Mode. Respect .do-not-edit. Be conservative. Only modify files under src/.";
}

const cwd = process.cwd();
const git = (...args: string[]) => exec("git", args, { cwd });
const gitIn = (dir: string, ...args: string[]) => exec("git", args, { cwd: dir });

// ── SQLite state (persists across hot-reloads) ─────────────────
const db = new Database("/tmp/dream-state.db");
db.exec(readFileSync(join(cwd, "src/app/api/database.sql"), "utf-8"));
try { db.exec("ALTER TABLE jobs ADD COLUMN finished_at INTEGER"); } catch { /* already exists */ }
db.exec(`
	UPDATE jobs SET status = 'error', error = 'Server restarted', finished_at = unixepoch()
	WHERE status IN ('running', 'accepting') AND finished_at IS NULL
`);

// ── DB helpers ─────────────────────────────────────────────────
type Row = Record<string, unknown>;

function dbGet(id: string): Row | undefined {
	return db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Row | undefined;
}

function dbCreate(id: string) {
	db.prepare("INSERT INTO jobs (id) VALUES (?)").run(id);
}

function dbSet(id: string, fields: Record<string, null | number | string>) {
	const keys = Object.keys(fields);
	if (keys.length === 0) return;
	db.prepare(`UPDATE jobs SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`)
		.run(...Object.values(fields), id);
}

function dbAppendLog(id: string, msg: string) {
	db.prepare("UPDATE jobs SET logs = json_insert(logs, '$[#]', ?) WHERE id = ?").run(msg, id);
}

function dbPollLogs(id: string): string[] {
	const row = dbGet(id);
	if (!row) return [];
	const all: string[] = JSON.parse(row.logs as string);
	const fresh = all.slice(row.cursor as number);
	if (fresh.length > 0) db.prepare("UPDATE jobs SET cursor = ? WHERE id = ?").run(all.length, id);
	return fresh;
}

// ── Free port finder ───────────────────────────────────────────
function findFreePort(start = 19200): Promise<number> {
	return new Promise((resolve, reject) => {
		const tryPort = (port: number) => {
			if (port > 19999) { reject(new Error("No free port in range 19200–19999")); return; }
			const srv = net.createServer();
			srv.once("error", () => tryPort(port + 1));
			srv.once("listening", () => srv.close(() => resolve(port)));
			srv.listen(port, "127.0.0.1");
		};
		tryPort(start);
	});
}

// ── Cleanup helper ─────────────────────────────────────────────
async function cleanupJob(id: string) {
	const row = dbGet(id);
	if (!row) return;
	if (row.dev_server_pid) {
		try { process.kill(row.dev_server_pid as number, "SIGTERM"); } catch { /* already dead */ }
	}
	if (row.clone_dir) {
		try { await exec("rm", ["-rf", row.clone_dir as string]); } catch { /* ignore */ }
	}
	dbSet(id, { dev_server_pid: null, clone_dir: null });
}

export async function POST(req: Request): Promise<Response> {
	const appMode = (process.env.APP_MODE ?? "develop").toLowerCase();
	if (appMode !== "dream" && appMode !== "develop") {
		return Response.json({ error: `Dream Mode is disabled (APP_MODE=${appMode})` }, { status: 403 });
	}

	const { prompt, screenshot, pollJobId, action, commitHash, jobId: actionJobId } = await req.json();

	// ── List recent dream commits ──────────────────────────────
	if (action === "listCommits") {
		try {
			const { stdout } = await git("log", "--oneline", "--grep=dream:", "-20", "--format=%H|%s|%ar");
			const commits = stdout.trim().split("\n").filter(Boolean).map((line: string) => {
				const [hash, ...rest] = line.split("|");
				const msg = rest.slice(0, -1).join("|");
				const ago = rest[rest.length - 1];
				return { hash, message: msg, ago };
			});
			return Response.json({ commits });
		} catch {
			return Response.json({ commits: [] });
		}
	}

	// ── Revert to a specific commit ────────────────────────────
	if (action === "revert" && commitHash) {
		try {
			await git("revert", "--no-commit", commitHash);
			await git("commit", "-m", `dream: revert ${commitHash.slice(0, 8)}`);
			return Response.json({ summary: `Reverted commit ${commitHash.slice(0, 8)}` });
		} catch (err: unknown) {
			await git("revert", "--abort").catch(() => {});
			return Response.json({ error: err instanceof Error ? err.message : "Revert failed" }, { status: 500 });
		}
	}

	// ── Accept: cherry-pick clone commits into main repo ───────
	if (action === "accept" && actionJobId) {
		const row = dbGet(actionJobId);
		if (!row) return Response.json({ error: "Job not found" }, { status: 404 });
		if (row.status !== "preview") return Response.json({ error: "Job is not in preview state" }, { status: 400 });

		dbSet(actionJobId, { status: "accepting" });
		const cloneDir = row.clone_dir as string;

		try {
			if (row.dev_server_pid) {
				try { process.kill(row.dev_server_pid as number, "SIGTERM"); } catch { /* ignore */ }
			}
			await git("fetch", cloneDir, "HEAD:refs/dream/temp");
			await git("cherry-pick", "refs/dream/temp");
			await git("update-ref", "-d", "refs/dream/temp");
			try { await exec("rm", ["-rf", cloneDir]); } catch { /* ignore */ }
			dbSet(actionJobId, { status: "done", clone_dir: null, dev_server_pid: null, finished_at: Date.now() / 1000 | 0 });
			return Response.json({ summary: row.summary ?? "Changes applied." });
		} catch (err) {
			await git("cherry-pick", "--abort").catch(() => {});
			await git("update-ref", "-d", "refs/dream/temp").catch(() => {});
			const error = err instanceof Error ? err.message : String(err);
			dbSet(actionJobId, { status: "error", error, finished_at: Date.now() / 1000 | 0 });
			return Response.json({ error }, { status: 500 });
		}
	}

	// ── Decline: discard clone ─────────────────────────────────
	if (action === "decline" && actionJobId) {
		const row = dbGet(actionJobId);
		if (!row) return Response.json({ error: "Job not found" }, { status: 404 });
		await cleanupJob(actionJobId);
		dbSet(actionJobId, { status: "done", finished_at: Date.now() / 1000 | 0 });
		return Response.json({ summary: "Changes discarded." });
	}

	// ── Poll: return current job status ────────────────────────
	if (pollJobId) {
		const row = dbGet(pollJobId);
		if (!row) return Response.json({ error: "Job not found" }, { status: 404 });
		const logs = dbPollLogs(pollJobId);
		return Response.json({
			status: row.status,
			logs,
			summary: row.summary,
			hasChanges: row.has_changes === 1,
			previewUrl: row.preview_url,
			error: row.error,
		});
	}

	// ── Start: clone repo, launch Claude, then preview server ──
	if (!prompt?.trim()) {
		return Response.json({ error: "prompt is required" }, { status: 400 });
	}

	let screenshotPath: string | undefined;
	if (screenshot) {
		const { writeFileSync } = await import("fs");
		const tmpDir = await import("os").then((os) => os.tmpdir());
		screenshotPath = join(tmpDir, `dream-screenshot-${Date.now()}.png`);
		const base64 = screenshot.replace(/^data:image\/png;base64,/, "");
		writeFileSync(screenshotPath, Buffer.from(base64, "base64"));
	}

	const jobId = `dream-${Date.now()}`;
	dbCreate(jobId);
	dbAppendLog(jobId, "Cloning repository...");
	console.log(`[Dream] Job ${jobId}: "${prompt.slice(0, 80)}"`);

	deferTask(async () => {
		const cloneDir = `/tmp/${jobId}`;
		dbSet(jobId, { clone_dir: cloneDir });

		try {
			// 1. Clone the repo locally (hardlinks, fast)
			await exec("git", ["clone", "--local", cwd, cloneDir]);
			dbAppendLog(jobId, "Repository cloned. Symlinking node_modules...");

			// 2. Install dependencies (bun uses global cache, fast)
			dbAppendLog(jobId, "Installing dependencies...");
			// npm ci ensures a clean, reproducible install from package-lock.json — do not replace with npm install
			await exec("npm", ["ci"], { cwd: cloneDir });
			dbAppendLog(jobId, "Starting Claude Code...");

			// 3. Run Claude Code in the clone
			const claudeArgs = [
				"--print",
				"--verbose",
				"--output-format", "stream-json",
				"--dangerously-skip-permissions",
				// Always fresh session — sessions are scoped to original project path
				"--append-system-prompt", systemPrompt,
			];

			const model = process.env.DREAM_MODEL;
			if (model) claudeArgs.push("--model", model);

			const fullPrompt = screenshotPath
				? `${prompt}\n\n[A screenshot of the current app state has been saved to ${screenshotPath} — read it for visual context]`
				: prompt;
			claudeArgs.push(fullPrompt);

			const start = Date.now();
			const rawOutput: string[] = [];
			let summary: string | undefined;

			await new Promise<void>((resolve, reject) => {
				const proc = spawn("claude", claudeArgs, {
					cwd: cloneDir,
					env: { ...process.env },
					stdio: ["ignore", "pipe", "pipe"],
				});

				proc.stdout.on("data", (chunk: Buffer) => {
					for (const line of chunk.toString().split("\n").filter(Boolean)) {
						rawOutput.push(line);
						try {
							const event = JSON.parse(line);
							if (event.type === "assistant" && event.message?.content) {
								for (const block of event.message.content) {
									if (block.type === "tool_use") {
										const input = block.input?.command ?? block.input?.file_path ?? block.input?.pattern ?? "";
										const log = `${block.name}: ${String(input).slice(0, 80)}`;
										dbAppendLog(jobId, log);
										console.log(`[Dream] ${jobId} ${log}`);
									}
								}
							} else if (event.type === "result") {
								summary = (event.result ?? "").replace(/\n{3,}/g, "\n\n").trim();
								if (event.cost_usd) console.log(`[Dream] ${jobId} Cost: $${event.cost_usd.toFixed(4)}`);
							}
						} catch { /* not JSON */ }
					}
				});

				proc.stderr.on("data", (chunk: Buffer) => {
					const text = chunk.toString().trim();
					if (text) {
						rawOutput.push(`[stderr] ${text}`);
						dbAppendLog(jobId, text);
						console.warn(`[Dream] ${jobId} stderr: ${text}`);
					}
				});

				proc.on("close", (code) => {
					const elapsed = ((Date.now() - start) / 1000).toFixed(1);
					console.log(`[Dream] ${jobId} Claude exited code=${code} in ${elapsed}s`);
					if (code !== 0 && !summary) {
						const detail = rawOutput.slice(-20).join("\n") || `exit code ${code}`;
						reject(new Error(`Claude exited ${code}:\n${detail}`));
					} else {
						resolve();
					}
				});

				proc.on("error", (err) => reject(new Error(`Failed to start claude: ${err.message}`)));
			});

			if (summary) dbSet(jobId, { summary });

			// 4. Commit any changes in the clone
			const { stdout: gitStatus } = await gitIn(cloneDir, "status", "--porcelain");
			const hasChanges = gitStatus.trim().length > 0;
			if (hasChanges) {
				await gitIn(cloneDir, "add", "-A");
				await exec("git", ["commit", "-m", `dream: ${prompt.slice(0, 72)}`], { cwd: cloneDir });
				console.log(`[Dream] ${jobId} committed in clone`);
			}

			if (!hasChanges) {
				dbSet(jobId, {
					status: "done",
					has_changes: 0,
					summary: summary ?? "No changes were made.",
					clone_dir: null,
					finished_at: Date.now() / 1000 | 0,
				});
				try { await exec("rm", ["-rf", cloneDir]); } catch { /* ignore */ }
				return;
			}

			// 5. Find a free port and start the preview dev server
			dbAppendLog(jobId, "Starting preview server...");
			const port = await findFreePort();
			const previewUrl = `http://localhost:${port}`;

			const devServer = spawn("npx", ["expo", "start", "--web", "--port", String(port)], {
				cwd: cloneDir,
				env: { ...process.env, APP_MODE: "develop", BROWSER: "none" },
				stdio: ["ignore", "pipe", "pipe"],
			});

			devServer.stdout.on("data", (chunk: Buffer) => {
				const text = chunk.toString().trim();
				if (text) console.log(`[Dream] ${jobId} dev: ${text.slice(0, 120)}`);
			});
			devServer.stderr.on("data", (chunk: Buffer) => {
				const text = chunk.toString().trim();
				if (text) console.warn(`[Dream] ${jobId} dev: ${text.slice(0, 120)}`);
			});
			devServer.on("error", (err) => console.error(`[Dream] ${jobId} dev error: ${err.message}`));

			dbSet(jobId, {
				status: "preview",
				has_changes: 1,
				preview_url: previewUrl,
				dev_server_pid: devServer.pid ?? null,
			});
			dbAppendLog(jobId, `Preview ready at ${previewUrl}`);
			console.log(`[Dream] ${jobId} preview at ${previewUrl}`);

			// Auto-decline after 30 minutes
			setTimeout(async () => {
				const row = dbGet(jobId);
				if (row?.status === "preview") {
					console.log(`[Dream] ${jobId} auto-declining after 30min`);
					await cleanupJob(jobId);
					dbSet(jobId, {
						status: "done",
						summary: `${row.summary ?? ""}\n\n*(Preview expired — changes discarded.)*`.trim(),
						finished_at: Date.now() / 1000 | 0,
					});
				}
			}, 30 * 60 * 1000);

		} catch (err) {
			console.error(`[Dream] ${jobId} failed:`, err);
			dbSet(jobId, {
				status: "error",
				error: err instanceof Error ? err.message : String(err),
				finished_at: Date.now() / 1000 | 0,
			});
			await cleanupJob(jobId);
		}
	});

	return Response.json({ jobId });
}
