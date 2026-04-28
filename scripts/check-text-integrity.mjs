import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = [
  ".github",
  "functions",
  "scripts",
  "src",
  "tests",
  "astro.config.mjs",
  "package.json",
];
const textExtensions = new Set([
  ".astro",
  ".css",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svelte",
  ".ts",
  ".yaml",
  ".yml",
]);
const ignoredSegments = new Set([".astro", ".git", "dist", "node_modules"]);
const suspiciousPatterns = [
  { label: "replacement character", pattern: /\uFFFD/ },
  { label: "mojibake marker", pattern: /\u00ef\u00bf\u00bd/ },
  {
    label: "Chinese mojibake",
    pattern:
      /\u93c3|\u68f0|\u9346|\u6769|\u951b|\u7280\u8a89|\u8fab|\u9429|\u7d8d|\ue15e/,
  },
];

function hasIgnoredSegment(filePath) {
  return filePath
    .split(path.sep)
    .some((segment) => ignoredSegments.has(segment));
}

async function collectTextFiles(entryPath) {
  const absolutePath = path.resolve(root, entryPath);
  if (hasIgnoredSegment(path.relative(root, absolutePath))) {
    return [];
  }

  const stats = await readdirOrFile(absolutePath);
  if (stats.type === "file") {
    return textExtensions.has(path.extname(absolutePath)) ? [absolutePath] : [];
  }

  const children = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(
    children.map((child) => collectTextFiles(path.join(entryPath, child.name))),
  );
  return nested.flat();
}

async function readdirOrFile(absolutePath) {
  try {
    await readdir(absolutePath);
    return { type: "directory" };
  } catch (error) {
    if (error.code === "ENOTDIR") {
      return { type: "file" };
    }
    throw error;
  }
}

const files = (await Promise.all(scanRoots.map(collectTextFiles))).flat();
const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    suspiciousPatterns.forEach(({ label, pattern }) => {
      if (pattern.test(line)) {
        findings.push({
          file: path.relative(root, file),
          line: index + 1,
          label,
          text: line.trim().slice(0, 140),
        });
      }
    });
  });
}

if (findings.length > 0) {
  console.error("Suspicious text encoding markers found:");
  findings.forEach((finding) => {
    console.error(
      `${finding.file}:${finding.line} [${finding.label}] ${finding.text}`,
    );
  });
  process.exit(1);
}

console.log(`Checked ${files.length} text files for encoding markers.`);
