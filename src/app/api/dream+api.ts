import { execFile } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const exec = promisify(execFile);

// Read the system prompt from project root at startup
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

	const { prompt, action, branch, sessionId, screenshot } = await req.json();

	// ── Keep: merge dream branch back into the original branch ──
	if (action === "keep" && branch) {
		try {
			const { stdout: currentBranch } = await git("rev-parse", "--abbrev-ref", "HEAD");
			// If we're on the dream branch, switch back to the original
			if (currentBranch.trim() === branch) {
				// The dream branch name encodes the original: dream/<original>/<timestamp>
				const parts = branch.split("/");
				const originalBranch = parts[1] ?? "main";
				await git("checkout", originalBranch);
				await git("merge", branch, "--no-ff", "-m", `dream: merge ${branch}`);
				await git("branch", "-d", branch);
				return Response.json({ summary: `Merged ${branch} into ${originalBranch}` });
			}
			await git("merge", branch, "--no-ff", "-m", `dream: merge ${branch}`);
			await git("branch", "-d", branch);
			return Response.json({ summary: `Merged ${branch}` });
		} catch (err: unknown) {
			return Response.json({ error: err instanceof Error ? err.message : "Merge failed" }, { status: 500 });
		}
	}

	// ── Discard: delete dream branch, restore original branch ──
	if (action === "discard" && branch) {
		try {
			const { stdout: currentBranch } = await git("rev-parse", "--abbrev-ref", "HEAD");
			if (currentBranch.trim() === branch) {
				const parts = branch.split("/");
				const originalBranch = parts[1] ?? "main";
				await git("checkout", originalBranch);
			}
			await git("branch", "-D", branch);
			return Response.json({ summary: `Discarded ${branch}` });
		} catch (err: unknown) {
			return Response.json({ error: err instanceof Error ? err.message : "Discard failed" }, { status: 500 });
		}
	}

	// ── Dream: create branch, run Claude Code, commit changes ──
	if (!prompt?.trim()) {
		return Response.json({ error: "prompt is required" }, { status: 400 });
	}

	try {
		// Remember current branch
		const { stdout: originalBranch } = await git("rev-parse", "--abbrev-ref", "HEAD");
		const original = originalBranch.trim();

		// Create a dream branch
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
		const slug = prompt.slice(0, 30).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/, "").toLowerCase();
		const dreamBranch = `dream/${original}/${timestamp}-${slug}`;

		await git("checkout", "-b", dreamBranch);

		// Save screenshot as temp file for Claude Code to reference
		let screenshotPath: string | undefined;
		if (screenshot) {
			const { writeFileSync } = await import("fs");
			const { join } = await import("path");
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
		const text = (result.result ?? "")
			.replace(/\n{3,}/g, "\n\n")
			.trim();
		const returnedSessionId = result.session_id ?? sessionId;

		// Commit changes if any
		const { stdout: status } = await git("status", "--porcelain");
		if (status.trim()) {
			await git("add", "-A");
			await exec("git", ["commit", "-m", `dream: ${prompt.slice(0, 72)}`], { cwd });
		}

		return Response.json({
			summary: text,
			branch: dreamBranch,
			hasChanges: status.trim().length > 0,
			sessionId: returnedSessionId,
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("Dream Mode error:", message);
		return Response.json({ error: message }, { status: 500 });
	}
}
