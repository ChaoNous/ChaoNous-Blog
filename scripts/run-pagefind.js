import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

process.env.NODE_NO_WARNINGS = "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const pagefindRunner = path.join(
	rootDir,
	"node_modules",
	"pagefind",
	"lib",
	"runner",
	"bin.cjs",
);

const suppressedMessages = new Set([
	"Note: Pagefind doesn't support stemming for the language zh-cn.",
	"Search will still work, but will not match across root words.",
]);

const suppressedPatterns = [
	/\[DEP0180\] DeprecationWarning: fs\.Stats constructor is deprecated\./,
	/\(Use `node --trace-deprecation \.\.\.` to show where the warning was created\)/,
];

process.removeAllListeners("warning");
process.on("warning", (warning) => {
	const warningText = String(warning?.stack || warning?.message || "").trim();
	if (
		!warningText ||
		suppressedPatterns.some((pattern) => pattern.test(warningText))
	) {
		return;
	}

	console.warn(warningText);
});

const result = spawnSync(process.execPath, [pagefindRunner, "--site", "dist"], {
	cwd: rootDir,
	encoding: "utf-8",
	env: {
		...process.env,
		NODE_NO_WARNINGS: "1",
		NODE_OPTIONS: [process.env.NODE_OPTIONS, "--no-deprecation"]
			.filter(Boolean)
			.join(" "),
	},
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

for (const stream of [result.stdout, result.stderr]) {
	if (!stream) {
		continue;
	}

	const filteredOutput = stream
		.split(/\r?\n/)
		.filter((line) => {
			const trimmed = line.trim();
			return (
				!suppressedMessages.has(trimmed) &&
				!suppressedPatterns.some((pattern) => pattern.test(trimmed))
			);
		})
		.join("\n")
		.trim();

	if (filteredOutput) {
		console.log(filteredOutput);
	}
}

if (result.status !== 0) {
	process.exit(result.status ?? 1);
}
