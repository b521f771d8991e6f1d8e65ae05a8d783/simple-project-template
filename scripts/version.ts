/**
 * Resolves the current app version from git state.
 *
 * Rules:
 *   1. If HEAD has a tag → use the tag name (e.g. "2026.04.02")
 *   2. If no tag → use the short commit hash (e.g. "abc1234")
 *   3. If the working tree is dirty → append "-dirty"
 *
 * Can be imported or run directly: `npx tsx scripts/version.ts`
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

function run(cmd: string): string {
	return execSync(cmd, { encoding: "utf-8" }).trim();
}

export function getVersion(): string {
	// In Nix sandbox or CI: read pre-written VERSION file
	if (existsSync("VERSION")) {
		return readFileSync("VERSION", "utf-8").trim();
	}

	// Check if HEAD points to a tag
	let version: string;
	try {
		version = run("git describe --tags --exact-match HEAD 2>/dev/null");
	} catch {
		// No tag on HEAD — use short commit hash
		version = run("git rev-parse --short HEAD");
	}

	// Check for dirty working tree
	try {
		execSync("git diff --quiet && git diff --cached --quiet", { stdio: "ignore" });
	} catch {
		version += "-dirty";
	}

	return version;
}

// When run directly, print the version
if (import.meta.url === `file://${process.argv[1]}`) {
	console.log(getVersion());
}
