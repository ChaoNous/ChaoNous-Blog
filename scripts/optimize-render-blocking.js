import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const homepagePath = path.join(rootDir, "dist", "index.html");

const blockingStylesheetPatterns = [
	/^MainGridLayout\..+\.css$/,
	/^index\..+\.css$/,
	/^main\..+\.css$/,
	/^variables\..+\.css$/,
];

const asyncStylesheetPatterns = [
	/^PostPage\..+\.css$/,
	/^LightDarkSwitch\..+\.css$/,
	/^Search\..+\.css$/,
	/^WallpaperSwitch\..+\.css$/,
	/^DisplaySettings\..+\.css$/,
	/^Icon\..+\.css$/,
	/^generated-zhuque-ui-font\..+\.css$/,
	/^local-fonts\..+\.css$/,
	/^transition\..+\.css$/,
	/^animation-enhancements\..+\.css$/,
	/^gradient-buttons\..+\.css$/,
];

const removableInlineStylePatterns = [
	/\.album-card\[data-astro-cid-/,
	/\.album-card\{transition:all/,
	/\.photo-gallery\{/,
	/\.password-protection\[data-astro-cid-/,
	/\.twikoo-container\[data-astro-cid-/,
	/\.timeline-node\[data-astro-cid-/,
	/\.skills-grid-container/,
];

function getDistFilePath(href) {
	return path.join(rootDir, "dist", href.replace(/^\//, "").replace(/\//g, path.sep));
}

async function optimizeHomepage() {
	let html;

	try {
		html = await fs.readFile(homepagePath, "utf-8");
	} catch (error) {
		if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
			return;
		}

		throw error;
	}

	const criticalStyleHrefs = [];

	html = html.replace(
		/<link rel="stylesheet" href="([^"]+)">/g,
		(fullMatch, href) => {
			const baseName = path.posix.basename(href);
			if (href.startsWith("/_astro/")) {
				return "";
			}
			if (
				blockingStylesheetPatterns.some((pattern) => pattern.test(baseName))
			) {
				criticalStyleHrefs.push(href);
				return "";
			}
			if (
				asyncStylesheetPatterns.some((pattern) => pattern.test(baseName))
			) {
				return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
			}
			return "";
		},
	);

	html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, (styleBlock) => {
		if (
			removableInlineStylePatterns.some((pattern) => pattern.test(styleBlock))
		) {
			return "";
		}
		return styleBlock;
	});

	const criticalStyleBlocks = await Promise.all(
		criticalStyleHrefs.map(async (href) => {
			const css = await fs.readFile(getDistFilePath(href), "utf-8");
			return `<style data-critical-css="${path.posix.basename(href)}">${css}</style>`;
		}),
	);

	if (criticalStyleBlocks.length > 0) {
		html = html.replace("</head>", `${criticalStyleBlocks.join("")}</head>`);
	}

	await fs.writeFile(homepagePath, html, "utf-8");
}

await optimizeHomepage();
