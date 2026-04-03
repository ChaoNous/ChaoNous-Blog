import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Core layout CSS to keep as regular render-blocking (prevents CLS)
const coreCssPatterns = [
  /^main\./,                          // Base layout structure (24KB)
  /^MainGridLayout\./,                // Grid layout (6KB)
  /^transition\./,                    // Transition animations (1KB)
  /^generated-zhuque-ui-font\./,      // Font face definitions (3KB)
];

// Stylesheets to load asynchronously (not needed for first paint)
const asyncCssPatterns = [
  /^PostPage\./,
  /^PostCard\./,
  /^PostMeta\./,
  /^LightDarkSwitch\./,
  /^Search\./,
  /^Icon\./,
  /^DisplaySettings\./,
  /^local-fonts\./,
  /^animation-enhancements\./,
  /^gradient-buttons\./,
  /^markdown\./,
  /^markdown-extend\./,
  /^expressive-code\./,
  /^vendor-katex\./,
  /^vendor-fancybox\./,
  /^fancybox-custom\./,
  /^Share\./,
  /^SharePoster\./,
  /^PostDetailLayout\./,
  /^Twikoo\./,
  /^AlbumCard\./,
  /^AlbumDetail\./,
];

// Stylesheets to remove entirely (duplicate or unnecessary)
const removableCssPatterns = [
  /^vendor-katex\.D-/,     // Duplicate with non-dash version
  /^vendor-fancybox\.D-/,   // Duplicate with non-dash version
];

async function optimizeHtmlFile(htmlPath) {
  let html;
  try {
    html = await fs.readFile(htmlPath, "utf-8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  // Replace stylesheet links with appropriate loading strategy
  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="([^"]+)">/g,
    (fullMatch, href) => {
      const fullUrl = href;
      const fileName = path.posix.basename(href);

      // Check if removable (duplicates)
      if (removableCssPatterns.some(p => p.test(fileName))) {
        return "";
      }

      // Core CSS: keep as regular render-blocking stylesheet
      if (coreCssPatterns.some(p => p.test(fileName))) {
        return fullMatch; // Keep unchanged
      }

      // Async CSS: preload and defer
      if (asyncCssPatterns.some(p => p.test(fileName))) {
        return `<link rel="preload" as="style" href="${fullUrl}" onload="this.onload=null;this.rel='stylesheet'">`;
      }

      // Unknown CSS: keep as regular stylesheet (safe default)
      return fullMatch;
    }
  );

  await fs.writeFile(htmlPath, html, "utf-8");
  console.log(`Optimized: ${path.relative(rootDir, htmlPath)}`);
}

async function optimizeAll() {
  const htmlFiles = await findHtmlFiles(distDir);
  console.log(`Found ${htmlFiles.length} HTML files to optimize`);

  for (const file of htmlFiles) {
    await optimizeHtmlFile(file);
  }
}

async function findHtmlFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

await optimizeAll();
