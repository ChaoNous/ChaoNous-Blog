import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fontSplit } from "cn-font-split";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

const SOURCE_FONT_PATH = path.join(ROOT_DIR, "public/assets/fonts/ZhuqueFangsong-Regular.ttf");
const OUTPUT_DIR = path.join(ROOT_DIR, "public/fonts/zhuque");
const GENERATED_CSS_PATH = path.join(ROOT_DIR, "src/styles/generated-zhuque-font.css");

async function main() {
	if (!fs.existsSync(SOURCE_FONT_PATH)) {
		console.log(`[Font-Split] Source font not found: ${SOURCE_FONT_PATH}`);
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
