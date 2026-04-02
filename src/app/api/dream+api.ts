import { spawn, execFile } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const exec = promisify(execFile);

let systemPrompt: string;
try {
	systemPrompt = readFileSync(join(process.cwd(), "src/app/api/dream-system-prompt.txt"), "utf-8");
} catch {
	systemPrompt = "You are Dream Mode. Respect .do-not-edit. Be conservative. Only modify files under src/.";
}

const cwd = process.cwd();
const git = (...args: string[]) => exec("git", args, { cwd });

// ── Job tracking ───────────────────────────────────────────────
interface DreamJob {
	status: "running" | "done" | "error";
	logs: string[];
	summary?: string;
	sessionId?: string;
	hasChanges?: boolean;
	error?: string;
}

const jobs = new Map<string, DreamJob>();
let jobCounter = 0;

export async function POST(req: Request): Promise<Response> {
	const appMode = (process.env.APP_MODE ?? "develop").toLowerCase();
	if (appMode !== "dream" && appMode !== "develop") {
		return Response.json({ error: `Dream Mode is disabled (APP_MODE=${appMode})` }, { status: 403 });
	}

	const { prompt, sessionId, screenshot, pollJobId } = await req.json();

	// ── Poll: return current job status ────────────────────────
	if (pollJobId) {
		const job = jobs.get(pollJobId);
		if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
		const response = { ...job };
		// Clear logs after sending so next poll gets only new ones
		const logs = [...job.logs];
		job.logs = [];
		return Response.json({ ...response, logs });
	}

	// ── Start: launch Claude Code in background ────────────────
	if (!prompt?.trim()) {
		return Response.json({ error: "prompt is required" }, { status: 400 });
	}

	// Save screenshot
	let screenshotPath: string | undefined;
	if (screenshot) {
		const { writeFileSync } = await import("fs");
		const tmpDir = await import("os").then((os) => os.tmpdir());
		screenshotPath = join(tmpDir, `dream-screenshot-${Date.now()}.png`);
		const base64 = screenshot.replace(/^data:image\/png;base64,/, "");
		writeFileSync(screenshotPath, Buffer.from(base64, "base64"));
	}

	const args = [
		"claude",
		"--print",
		"--output-format", "stream-json",
		"--dangerously-skip-permissions",
	];

	if (sessionId) {
		args.push("--resume", sessionId);
	} else {
		args.push("--append-system-prompt", systemPrompt);
	}

	const model = process.env.DREAM_MODEL;
	if (model) args.push("--model", model);

	const fullPrompt = screenshotPath
		? `${prompt}\n\n[A screenshot of the current app state has been saved to ${screenshotPath} — read it for visual context]`
		: prompt;
	args.push(fullPrompt);

	const jobId = `dream-${++jobCounter}`;
	const job: DreamJob = { status: "running", logs: ["Starting Claude Code..."] };
	jobs.set(jobId, job);

	console.log(`[Dream] Job ${jobId}: "${prompt.slice(0, 80)}"`);

	// Run in background
	const proc = spawn("npx", args, { cwd, env: { ...process.env } });
	const start = Date.now();

	proc.stdout.on("data", (chunk: Buffer) => {
		for (const line of chunk.toString().split("\n").filter(Boolean)) {
			try {
				const event = JSON.parse(line);
				if (event.type === "assistant" && event.message?.content) {
					for (const block of event.message.content) {
						if (block.type === "tool_use") {
							const input = block.input?.command ?? block.input?.file_path ?? block.input?.pattern ?? "";
							const log = `${block.name}: ${String(input).slice(0, 80)}`;
							job.logs.push(log);
							console.log(`[Dream] ${jobId} ${log}`);
						}
					}
				} else if (event.type === "result") {
					job.summary = (event.result ?? "").replace(/\n{3,}/g, "\n\n").trim();
					job.sessionId = event.session_id ?? sessionId;
					if (event.cost_usd) console.log(`[Dream] ${jobId} Cost: $${event.cost_usd.toFixed(4)}`);
				}
			} catch { /* not JSON */ }
		}
	});

	proc.stderr.on("data", (chunk: Buffer) => {
		const text = chunk.toString().trim();
		if (text) {
			job.logs.push(text);
			console.warn(`[Dream] ${jobId} stderr: ${text}`);
		}
	});

	proc.on("close", async (code) => {
		const elapsed = ((Date.now() - start) / 1000).toFixed(1);
		console.log(`[Dream] ${jobId} exited code=${code} in ${elapsed}s`);

		try {
			const { stdout: status } = await git("status", "--porcelain");
			const hasChanges = status.trim().length > 0;
			if (hasChanges) {
				await git("add", "-A");
				await exec("git", ["commit", "-m", `dream: ${prompt.slice(0, 72)}`], { cwd });
				console.log(`[Dream] ${jobId} committed`);
			}
			job.hasChanges = hasChanges;
			job.status = "done";
			job.logs.push(`Completed in ${elapsed}s`);
		} catch (err) {
			job.status = "error";
			job.error = String(err);
		}

		// Clean up job after 5 minutes
		setTimeout(() => jobs.delete(jobId), 5 * 60 * 1000);
	});

	proc.on("error", (err) => {
		job.status = "error";
		job.error = err.message;
	});

	return Response.json({ jobId });
}
