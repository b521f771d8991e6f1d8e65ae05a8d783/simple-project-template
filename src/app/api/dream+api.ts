import { execFile } from "child_process";
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

export async function POST(req: Request): Promise<Response> {
	const appMode = (process.env.APP_MODE ?? "develop").toLowerCase();
	if (appMode !== "dream" && appMode !== "develop") {
		return Response.json({ error: `Dream Mode is disabled (APP_MODE=${appMode})` }, { status: 403 });
	}

	const { prompt, action, sessionId, screenshot } = await req.json();

	// ── Keep: the commit is already on the branch, nothing to do ──
	if (action === "keep") {
		return Response.json({ summary: "Changes kept." });
	}

	// ── Discard: undo the last dream commit ──
	if (action === "discard") {
		try {
			await git("reset", "--hard", "HEAD~1");
			return Response.json({ summary: "Changes discarded." });
		} catch (err: unknown) {
			return Response.json({ error: err instanceof Error ? err.message : "Discard failed" }, { status: 500 });
		}
	}

	// ── Dream: stash, run Claude Code, commit ──
	if (!prompt?.trim()) {
		return Response.json({ error: "prompt is required" }, { status: 400 });
	}

	try {
		// Stash any uncommitted work
		const { stdout: stashOut } = await git("stash", "push", "-m", "dream: pre-dream stash");
		const didStash = !stashOut.includes("No local changes");

		// Save screenshot as temp file for Claude Code to reference
		let screenshotPath: string | undefined;
		if (screenshot) {
			const { writeFileSync } = await import("fs");
			const tmpDir = await import("os").then((os) => os.tmpdir());
			screenshotPath = join(tmpDir, `dream-screenshot-${Date.now()}.png`);
			const base64 = screenshot.replace(/^data:image\/png;base64,/, "");
			writeFileSync(screenshotPath, Buffer.from(base64, "base64"));
		}

		// Run Claude Code (resume session if continuing a conversation)
		const args = [
			"claude",
			"--print",
			"--output-format", "json",
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

		const { stdout } = await exec("npx", args, {
			cwd,
			timeout: 120_000,
			maxBuffer: 10 * 1024 * 1024,
			env: { ...process.env },
		});

		// Parse Claude Code JSON response
		const result = JSON.parse(stdout);
		const text = (result.result ?? "").replace(/\n{3,}/g, "\n\n").trim();
		const returnedSessionId = result.session_id ?? sessionId;

		// Commit changes if any
		const { stdout: status } = await git("status", "--porcelain");
		const hasChanges = status.trim().length > 0;
		if (hasChanges) {
			await git("add", "-A");
			await exec("git", ["commit", "-m", `dream: ${prompt.slice(0, 72)}`], { cwd });
		}

		// Restore stashed work on top
		if (didStash) {
			await git("stash", "pop").catch(() => {});
		}

		return Response.json({
			summary: text,
			hasChanges,
			sessionId: returnedSessionId,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("Dream Mode error:", message);
		return Response.json({ error: message }, { status: 500 });
	}
}
