import { existsSync } from "fs";
import { join } from "path";

export function GET(): Response {
	const hasSources = process.env.DREAM_MODE_SOURCES
		|| (existsSync(join(process.cwd(), "package.json")) && existsSync(join(process.cwd(), ".git")));
	return Response.json({ mode: hasSources ? "dream" : "build" });
}
