/**
 * Creates a CalVer annotated, signed git tag.
 *
 * Format: yyyy.mm.dd (first of the day) or yyyy.mm.dd.N (Nth release that day)
 *
 * Usage:
 *   npx tsx scripts/tag.ts                     # tags and prompts for message
 *   npx tsx scripts/tag.ts "release notes"     # tags with given message
 *   npx tsx scripts/tag.ts --push              # tags and pushes to origin
 *   npx tsx scripts/tag.ts --push "message"    # tags with message and pushes
 */
import { execSync } from "child_process";
import * as readline from "readline";

function run(cmd: string): string {
	return execSync(cmd, { encoding: "utf-8" }).trim();
}

function fail(msg: string): never {
	console.error(`Error: ${msg}`);
	process.exit(1);
}

function prompt(question: string): Promise<string> {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

async function main() {
	// Parse args
	const args = process.argv.slice(2);
	const shouldPush = args.includes("--push");
	const message = args.filter((a) => a !== "--push").join(" ").trim();

	// Verify clean working tree
	try {
		execSync("git diff --quiet && git diff --cached --quiet", { stdio: "ignore" });
	} catch {
		fail("Working tree is dirty. Commit or stash changes before tagging.");
	}

	// Compute CalVer tag
	const now = new Date();
	const dateTag = [
		now.getFullYear(),
		String(now.getMonth() + 1).padStart(2, "0"),
		String(now.getDate()).padStart(2, "0"),
	].join(".");

	// Find existing same-day tags to determine sequence number
	const existing = run(`git tag -l "${dateTag}*"`)
		.split("\n")
		.filter(Boolean);

	let tagName: string;
	if (existing.length === 0) {
		tagName = dateTag;
	} else {
		// Find the highest sequence number
		const sequences = existing.map((t) => {
			const parts = t.split(".");
			return parts.length > 3 ? parseInt(parts[3], 10) : 1;
		});
		const next = Math.max(...sequences) + 1;
		tagName = `${dateTag}.${next}`;
	}

	// Get tag message
	let tagMessage = message;
	if (!tagMessage) {
		// Show recent commits for context
		const log = run('git log --oneline -5');
		console.log("\nRecent commits:");
		console.log(log);
		console.log();
		tagMessage = await prompt(`Tag message for ${tagName}: `);
		if (!tagMessage) fail("Tag message is required.");
	}

	// Create annotated signed tag
	console.log(`\nCreating signed tag: ${tagName}`);
	try {
		execSync(`git tag -s -a "${tagName}" -m "${tagMessage.replace(/"/g, '\\"')}"`, {
			stdio: "inherit",
		});
	} catch {
		fail("Failed to create signed tag. Is GPG/SSH signing configured?");
	}

	console.log(`Tag ${tagName} created.`);

	// Push if requested
	if (shouldPush) {
		console.log(`Pushing ${tagName} to origin...`);
		execSync(`git push origin "${tagName}"`, { stdio: "inherit" });
	} else {
		console.log(`Run \`git push origin ${tagName}\` to push the tag.`);
	}
}

main();
