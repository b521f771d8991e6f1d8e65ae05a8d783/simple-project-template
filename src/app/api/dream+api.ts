import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

export async function POST(req: Request): Promise<Response> {
	const appMode = (process.env.APP_MODE ?? "develop").toLowerCase();
	if (appMode !== "dream" && appMode !== "develop") {
		return Response.json({ error: `Dream Mode is disabled (APP_MODE=${appMode})` }, { status: 403 });
	}

	const { prompt } = await req.json();
	if (!prompt?.trim()) {
		return Response.json({ error: "prompt is required" }, { status: 400 });
	}

	try {
		const args = [
			"claude",
			"--print",
			"--output-format", "text",
			"--dangerously-skip-permissions",
			prompt,
		];

		const model = process.env.DREAM_MODEL;
		if (model) args.splice(3, 0, "--model", model);

		const { stdout } = await exec("npx", args, {
			cwd: process.cwd(),
			timeout: 120_000,
			maxBuffer: 10 * 1024 * 1024,
			env: { ...process.env },
		});

		return Response.json({ summary: stdout.trim() });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("Dream Mode error:", message);
		return Response.json({ error: message }, { status: 500 });
	}
}
