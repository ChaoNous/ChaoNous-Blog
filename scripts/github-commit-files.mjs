import { readFile } from "node:fs/promises";
import path from "node:path";

const REQUIRED_ENV = ["GITHUB_TOKEN"];
const DEFAULT_REPO = "ChaoNous/ChaoNous-Blog";
const DEFAULT_BRANCH = "main";

function printUsage() {
	console.log(`Usage:
  node scripts/github-commit-files.mjs --message "Commit message" --files path1,path2[,path3]

Options:
  --message   Required. Git commit message written to GitHub.
  --files     Required. Comma-separated repository-relative file paths.
  --repo      Optional. Defaults to ${DEFAULT_REPO}.
  --branch    Optional. Defaults to ${DEFAULT_BRANCH}.

Environment:
  GITHUB_TOKEN   Required. Personal access token with repo write access.
`);
}

function parseArgs(argv) {
	const args = {
		repo: DEFAULT_REPO,
		branch: DEFAULT_BRANCH,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const current = argv[i];
		const next = argv[i + 1];

		if (current === "--message") {
			args.message = next;
			i += 1;
			continue;
		}
		if (current === "--files") {
			args.files = next
				?.split(",")
				.map((item) => item.trim())
				.filter(Boolean);
			i += 1;
			continue;
		}
		if (current === "--repo") {
			args.repo = next;
			i += 1;
			continue;
		}
		if (current === "--branch") {
			args.branch = next;
			i += 1;
			continue;
		}
		if (current === "--help" || current === "-h") {
			args.help = true;
			continue;
		}
		throw new Error(`Unknown argument: ${current}`);
	}

	return args;
}

function assertInputs(args) {
	if (args.help) {
		printUsage();
		process.exit(0);
	}

	for (const envName of REQUIRED_ENV) {
		if (!process.env[envName]) {
			throw new Error(`Missing required environment variable: ${envName}`);
		}
	}

	if (!args.message?.trim()) {
		throw new Error("Missing required --message argument.");
	}

	if (!Array.isArray(args.files) || args.files.length === 0) {
		throw new Error("Missing required --files argument.");
	}
}

function buildHeaders() {
	return {
		Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
		Accept: "application/vnd.github+json",
		"User-Agent": "chaonous-blog-github-commit-script",
	};
}

async function githubJson(url, options = {}) {
	const response = await fetch(url, options);
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`GitHub API ${response.status} ${response.statusText}: ${text}`);
	}

	return response.json();
}

async function createBlob(repo, bytes) {
	return githubJson(`https://api.github.com/repos/${repo}/git/blobs`, {
		method: "POST",
		headers: {
			...buildHeaders(),
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			content: Buffer.from(bytes).toString("base64"),
			encoding: "base64",
		}),
	});
}

async function run() {
	const args = parseArgs(process.argv.slice(2));
	assertInputs(args);

	const cwd = process.cwd();
	const ref = await githubJson(
		`https://api.github.com/repos/${args.repo}/git/ref/heads/${args.branch}`,
		{ headers: buildHeaders() },
	);
	const parentSha = ref.object.sha;
	const parentCommit = await githubJson(
		`https://api.github.com/repos/${args.repo}/git/commits/${parentSha}`,
		{ headers: buildHeaders() },
	);

	const tree = [];
	for (const relativeFile of args.files) {
		const absoluteFile = path.resolve(cwd, relativeFile);
		const bytes = await readFile(absoluteFile);
		const blob = await createBlob(args.repo, bytes);
		tree.push({
			path: relativeFile.replaceAll("\\", "/"),
			mode: "100644",
			type: "blob",
			sha: blob.sha,
		});
	}

	const newTree = await githubJson(
		`https://api.github.com/repos/${args.repo}/git/trees`,
		{
			method: "POST",
			headers: {
				...buildHeaders(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				base_tree: parentCommit.tree.sha,
				tree,
			}),
		},
	);

	const newCommit = await githubJson(
		`https://api.github.com/repos/${args.repo}/git/commits`,
		{
			method: "POST",
			headers: {
				...buildHeaders(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				message: args.message.trim(),
				tree: newTree.sha,
				parents: [parentSha],
			}),
		},
	);

	await githubJson(
		`https://api.github.com/repos/${args.repo}/git/refs/heads/${args.branch}`,
		{
			method: "PATCH",
			headers: {
				...buildHeaders(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sha: newCommit.sha,
				force: false,
			}),
		},
	);

	console.log(
		JSON.stringify(
			{
				ok: true,
				repo: args.repo,
				branch: args.branch,
				commit: newCommit.sha,
				files: args.files,
			},
			null,
			2,
		),
	);
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
