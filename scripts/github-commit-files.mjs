import { readFile } from "node:fs/promises";
import path from "node:path";
const REQUIRED_ENV = ["GITHUB_TOKEN"];
const DEFAULT_REPO = "ChaoNous/ChaoNous-Blog";
const DEFAULT_BRANCH = "main";
function printUsage() {
    console.log(`Usage:
  node scripts/github-commit-files.mjs --message "Commit message" --files path1,path2 [--delete-files path3,path4]

Options:
  --message      Required. Git commit message.
  --files        Optional. Comma-separated files to add/update.
  --delete-files Optional. Comma-separated files to delete.
  --repo         Optional. Defaults to ${DEFAULT_REPO}.
  --branch       Optional. Defaults to ${DEFAULT_BRANCH}.
`);
}
function parseArgs(argv) {
    const args = {
        repo: DEFAULT_REPO,
        branch: DEFAULT_BRANCH,
        files: [],
        deleteFiles: [],
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
            args.files = next?.split(",").map(f => f.trim()).filter(Boolean) || [];
            i += 1;
            continue;
        }
        if (current === "--delete-files") {
            args.deleteFiles = next?.split(",").map(f => f.trim()).filter(Boolean) || [];
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
    }
    return args;
}
async function githubJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API ${response.status}: ${text}`);
    }
    return response.json();
}
async function run() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        printUsage();
        process.exit(0);
    }
    if (!process.env.GITHUB_TOKEN)
        throw new Error("Missing GITHUB_TOKEN");
    if (!args.message)
        throw new Error("Missing --message");
    const headers = {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "github-commit-script",
    };
    const ref = await githubJson(`https://api.github.com/repos/${args.repo}/git/ref/heads/${args.branch}`, { headers });
    const parentSha = ref.object.sha;
    const parentCommit = await githubJson(`https://api.github.com/repos/${args.repo}/git/commits/${parentSha}`, { headers });
    const tree = [];
    for (const relFile of args.files) {
        const content = await readFile(path.resolve(process.cwd(), relFile));
        const blob = await githubJson(`https://api.github.com/repos/${args.repo}/git/blobs`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
        });
        tree.push({ path: relFile.replaceAll("\\", "/"), mode: "100644", type: "blob", sha: blob.sha });
    }
    for (const relFile of args.deleteFiles) {
        tree.push({ path: relFile.replaceAll("\\", "/"), mode: "100644", type: "blob", sha: null });
    }
    const newTree = await githubJson(`https://api.github.com/repos/${args.repo}/git/trees`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
    });
    const newCommit = await githubJson(`https://api.github.com/repos/${args.repo}/git/commits`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ message: args.message, tree: newTree.sha, parents: [parentSha] }),
    });
    await githubJson(`https://api.github.com/repos/${args.repo}/git/refs/heads/${args.branch}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ sha: newCommit.sha }),
    });
    console.log(`Success: ${newCommit.sha}`);
}
run().catch(e => { console.error(e.message); process.exit(1); });
