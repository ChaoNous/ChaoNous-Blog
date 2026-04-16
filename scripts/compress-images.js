import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const DIRECTORIES_TO_SCAN = [
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "src/assets"),
];

const EXTENSIONS = [".jpg", ".jpeg", ".png"];
const REFERENCE_PATHS = [
  path.join(process.cwd(), "src"),
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "scripts"),
  path.join(process.cwd(), "functions"),
  path.join(process.cwd(), "tests"),
  path.join(process.cwd(), "astro.config.mjs"),
  path.join(process.cwd(), "package.json"),
  path.join(process.cwd(), "tsconfig.json"),
];
const TEXT_FILE_EXTENSIONS = new Set([
  ".astro",
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mdx",
  ".mjs",
  ".svelte",
  ".styl",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

async function collectReferenceCorpus(entryPath, chunks = []) {
  try {
    const stat = await fs.stat(entryPath);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(entryPath);
      for (const entry of entries) {
        await collectReferenceCorpus(path.join(entryPath, entry), chunks);
      }
      return chunks;
    }

    if (!TEXT_FILE_EXTENSIONS.has(path.extname(entryPath).toLowerCase())) {
      return chunks;
    }

    chunks.push(await fs.readFile(entryPath, "utf8"));
    return chunks;
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Error indexing references from ${entryPath}:`, error);
    }

    return chunks;
  }
}

function getReferenceCandidates(outputPath) {
  const relativePath = path
    .relative(process.cwd(), outputPath)
    .replace(/\\/g, "/");
  const candidates = new Set([relativePath]);

  if (relativePath.startsWith("public/")) {
    const publicRelativePath = relativePath.slice("public/".length);
    candidates.add(publicRelativePath);
    candidates.add(`/${publicRelativePath}`);
  }

  if (relativePath.startsWith("src/")) {
    candidates.add(relativePath.slice("src/".length));
  }

  return [...candidates];
}

function isReferenced(outputPath, referenceCorpus) {
  return getReferenceCandidates(outputPath).some((candidate) =>
    referenceCorpus.includes(candidate),
  );
}

async function processDirectory(dir, referenceCorpus) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await processDirectory(fullPath, referenceCorpus);
      } else if (EXTENSIONS.includes(path.extname(fullPath).toLowerCase())) {
        await compressToWebp(fullPath, referenceCorpus);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Error processing directory ${dir}:`, error);
    }
  }
}

async function compressToWebp(filePath, referenceCorpus) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  const outputPath = path.join(dir, `${basename}.webp`);

  try {
    if (!isReferenced(outputPath, referenceCorpus)) {
      return;
    }

    // Check if webp version already exists and is newer
    try {
      const sourceStat = await fs.stat(filePath);
      const outStat = await fs.stat(outputPath);
      if (outStat.mtime > sourceStat.mtime) {
        return; // Already compressed and up to date
      }
    } catch (e) {
      // Webp doesn't exist, proceed to generate
    }

    console.log(`Compressing ${filePath} to webp...`);
    await sharp(filePath)
      .webp({ quality: 80, effort: 6 }) // High effort for better compression
      .toFile(outputPath);

    const originalSize = (await fs.stat(filePath)).size;
    const newSize = (await fs.stat(outputPath)).size;
    const savings = (((originalSize - newSize) / originalSize) * 100).toFixed(
      2,
    );

    console.log(
      `\x1b[32m[ok] Compressed ${basename}${ext} -> ${basename}.webp (Saved ${savings}%)\x1b[0m`,
    );
  } catch (error) {
    console.error(
      `\x1b[31m[error] Failed to compress ${filePath}:\x1b[0m`,
      error,
    );
  }
}

async function main() {
  console.log("\x1b[36mStarting image compression pipeline...\x1b[0m");

  const referenceCorpusChunks = [];
  for (const referencePath of REFERENCE_PATHS) {
    await collectReferenceCorpus(referencePath, referenceCorpusChunks);
  }
  const referenceCorpus = referenceCorpusChunks.join("\n");

  for (const dir of DIRECTORIES_TO_SCAN) {
    await processDirectory(dir, referenceCorpus);
  }

  console.log("\x1b[36mImage compression finished!\x1b[0m");
  console.log("Only referenced .webp targets are generated.");
}

main();
