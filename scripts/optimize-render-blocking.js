import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const homepagePath = path.join(rootDir, "dist", "index.html");

const keepStylesheetPatterns = [
	/^PostPage\..+\.css$/,
	/^LightDarkSwitch\..+\.css$/,
	/^Search\..+\.css$/,
	/^WallpaperSwitch\..+\.css$/,
	/^DisplaySettings\..+\.css$/,
	/^MainGridLayout\..+\.css$/,
	/^index\..+\.css$/,
	/^Icon\..+\.css$/,
	/^generated-zhuque-ui-font\..+\.css$/,
	/^local-fonts\..+\.css$/,
	/^main\..+\.css$/,
	/^transition\..+\.css$/,
	/^variables\..+\.css$/,
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

	html = html.replace(
		/<link rel="stylesheet" href="([^"]+)">/g,
		(fullMatch, href) => {
			const baseName = path.posix.basename(href);
			if (href.startsWith("/_astro/")) {
				return "";
			}
			const shouldKeep = keepStylesheetPatterns.some((pattern) =>
				pattern.test(baseName),
			);
			return shouldKeep ? fullMatch : "";
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

	await fs.writeFile(homepagePath, html, "utf-8");
}

await optimizeHomepage();
