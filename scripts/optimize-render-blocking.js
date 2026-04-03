import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

// Critical CSS: loaded synchronously via regular stylesheet (needed for first paint)
// These are the styles required to render the initial homepage view
const criticalCssPatterns = [
  /^MainGridLayout\./,
  /^main\./,
];

// Async CSS: preload + onload swap (not needed for first paint)
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
];

// Remove these entirely (duplicates)
const removableCssPatterns = [
  /^vendor-katex\.D-/,
  /^vendor-fancybox\.D-/,
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

  // Step 1: Replace render-blocking stylesheet links
  html = html.replace(
    /<link\s+rel="stylesheet"\s+href="([^"]+)">/g,
    (fullMatch, href) => {
      const fileName = path.posix.basename(href);

      // Remove duplicates
      if (removableCssPatterns.some(p => p.test(fileName))) {
        return "";
      }

      // Keep critical CSS as regular stylesheet (synchronous, fast)
      if (criticalCssPatterns.some(p => p.test(fileName))) {
        criticalStyleHrefs.push(href);
        return fullMatch;
      }

      // Defer non-critical CSS
      if (asyncCssPatterns.some(p => p.test(fileName))) {
        return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'">`;
      }

      // Unknown CSS: remove (shouldn't happen)
      return "";
    }
  );

  // Step 2: Remove duplicate preload-as-style links (from Astro's own preload system)
  // These are extra preload links that duplicate what we already handle
  const preloadCssRegex = /<link\s+rel="preload"\s+as="style"\s+href="([^"]+)"[^>]*>/g;
  html = html.replace(preloadCssRegex, (fullMatch, href) => {
    // Don't remove if it's not already handled above
    const fileName = path.posix.basename(href);
    if (asyncCssPatterns.some(p => p.test(fileName))) {
      return fullMatch; // Keep the preload we just created
    }
    if (criticalCssPatterns.some(p => p.test(fileName))) {
      return ""; // Remove duplicate preload for critical CSS
    }
    return ""; // Remove unknown preloads
  });

  // Step 3: Remove font preload (delays FCP due to 373KB Zhuque font)
  // Fonts use font-display: swap, so no need to preload
  html = html.replace(
    /<link\s+rel="preload"\s+as="font"[^>]+>/g,
    ""
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
