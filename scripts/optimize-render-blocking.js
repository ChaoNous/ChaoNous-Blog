import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Stylesheets to inline as critical CSS (only small ones under ~10KB)
// Large CSS should remain as regular stylesheets - inlining increases HTML size
const criticalCssPatterns = [
  // No critical CSS inlining for this project
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
  /^generated-zhuque-ui-font\./,
  /^local-fonts\./,
  /^transition\./,
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
  // Homepage-critical but not first-paint: load async
  /^MainGridLayout\./,
  /^main\./,
];

// Stylesheets to remove entirely (duplicate or unnecessary)
const removableCssPatterns = [
  /^vendor-katex\.D-/,     // Duplicate with non-dash version
  /^vendor-fancybox\.D-/,   // Duplicate with non-dash version
];

function getDistFilePath(href) {
  const relativePath = href.replace(/^\//, "").replace(/\//g, path.sep);
  return path.join(distDir, relativePath);
}

async function optimizeHtmlFile(htmlPath) {
  let html;
  try {
    html = await fs.readFile(htmlPath, "utf-8");
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  const criticalStyleHrefs = [];

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

      // Check if critical - inline it
      if (criticalCssPatterns.some(p => p.test(fileName))) {
        criticalStyleHrefs.push(href);
        return "";
      }

      // Check if async - preload and defer
      if (asyncCssPatterns.some(p => p.test(fileName))) {
        return `<link rel="preload" as="style" href="${fullUrl}" onload="this.onload=null;this.rel='stylesheet'">`;
      }

      // Default: remove and let critical CSS handle it (or leave as-is if unknown)
      return "";
    }
  );

  // Inline critical CSS
  const criticalStyleBlocks = await Promise.all(
    criticalStyleHrefs.map(async (href) => {
      try {
        const css = await fs.readFile(getDistFilePath(href), "utf-8");
        return `<style data-critical-css="${path.posix.basename(href)}">${css}</style>`;
      } catch {
        return "";
      }
    })
  );

  if (criticalStyleBlocks.length > 0) {
    html = html.replace("</head>", `${criticalStyleBlocks.join("")}</head>`);
  }

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
