import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

const SOURCE_FONT_PATH = path.join(ROOT_DIR, "public/assets/fonts/ZhuqueFangsong-Regular.ttf");
const OUTPUT_DIR = path.join(ROOT_DIR, "public/fonts/zhuque");
const GENERATED_CSS_PATH = path.join(ROOT_DIR, "src/styles/generated-zhuque-font.css");
const FALLBACK_FONT_PUBLIC_PATH = "/assets/fonts/ZhuqueFangsong-Regular.ttf";
const SHOULD_ATTEMPT_SPLIT = process.env.ENABLE_FONT_SPLIT === "true";

function writeFallbackCss(reason) {
	const cssContent = `/* Auto fallback generated during build */
@font-face {
  font-family: "ZhuqueFangsong";
  src: url("${FALLBACK_FONT_PUBLIC_PATH}") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
`;

	fs.writeFileSync(GENERATED_CSS_PATH, cssContent, "utf8");
	console.warn(`[Font-Split] Fallback font CSS generated: ${reason}`);
}

async function main() {
	if (!fs.existsSync(SOURCE_FONT_PATH)) {
		console.log(`[Font-Split] Source font not found: ${SOURCE_FONT_PATH}`);
		writeFallbackCss("source font missing, keep build unblocked");
		return;
	}

	if (!SHOULD_ATTEMPT_SPLIT) {
		writeFallbackCss("font slicing disabled by default for reliable builds");
		return;
	}

	// 1. Double check the file and clone it to temp directory to avoid any CI file access issues
	const tempFontDir = fs.mkdtempSync(path.join(os.tmpdir(), "font-split-"));
	const tempFontPath = path.join(tempFontDir, "font-to-split.ttf");
	
	try {
		const sourceBuffer = fs.readFileSync(SOURCE_FONT_PATH);
		console.log(`[Font-Split] Source file size checked: ${sourceBuffer.length} bytes`);
		fs.writeFileSync(tempFontPath, sourceBuffer);
		console.log(`[Font-Split] Cloned to temporary path: ${tempFontPath}`);

		console.log("[Font-Split] Slicing started. Engine: cn-font-split/rust-core");

		if (fs.existsSync(OUTPUT_DIR)) {
			fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
		}
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });

		try {
			const { fontSplit } = await import("cn-font-split");

			// 2. Perform splitting
			await fontSplit({
				FontPath: tempFontPath,
				destFolder: OUTPUT_DIR,
				outDir: OUTPUT_DIR, // Double protection for API variations
				cssName: "ZhuqueFangsong",
				targetType: "woff2",
				chunkSize: 70 * 1024,
				testHTML: false,
				reporter: false,
				log: (msg) => console.log(`[Font-Split] ${msg}`),
			});

			// 3. Sync and fix CSS
			const tempCssPath = path.join(OUTPUT_DIR, "result.css");
			if (fs.existsSync(tempCssPath)) {
				let cssContent = fs.readFileSync(tempCssPath, "utf8");
				cssContent = cssContent.replace(/url\(['"]?([^'"]+)['"]?\)/g, (match, url) => {
					if (!url.startsWith("http") && !url.startsWith("/")) {
						return `url('/fonts/zhuque/${url}')`;
					}
					return match;
				});
				fs.writeFileSync(GENERATED_CSS_PATH, cssContent, "utf8");
				console.log("[Font-Split] All slices and optimized CSS generated.");
			} else {
				writeFallbackCss("font split finished without result.css");
			}
		} catch (error) {
			writeFallbackCss(
				error instanceof Error ? error.message : "font split runtime failure",
			);
		}
	} finally {
		// Cleanup temp font
		try {
			fs.rmSync(tempFontDir, { recursive: true, force: true });
		} catch (e) {
			// ignore
		}
	}
}

process.env.RUST_BACKTRACE = "1";
main().catch((err) => {
	console.error("[Font-Split] CRITICAL FAILURE:", err);
	process.exit(1);
});
