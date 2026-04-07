import fs from "node:fs";
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
		console.log(`[Font-Split] Source font not found, skip: ${SOURCE_FONT_PATH}`);
		return;
	}

	console.log("[Font-Split] Start slicing Zhuque Fangsong font...");

	// Ensure output directory exists and is clean
	if (fs.existsSync(OUTPUT_DIR)) {
		fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
	}
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	try {
		await fontSplit({
			FontPath: SOURCE_FONT_PATH,
			destFolder: OUTPUT_DIR,
			cssName: "ZhuqueFangsong",
			targetType: "woff2",
			chunkSize: 70 * 1024, // 70KB per slice
			testHTML: false,
			reporter: false,
			log: (msg) => console.log(`[Font-Split] ${msg}`),
		});

		// Moving result.css to src/styles to ensure Astro can bundle it
		const tempCssPath = path.join(OUTPUT_DIR, "result.css");
		if (fs.existsSync(tempCssPath)) {
			let cssContent = fs.readFileSync(tempCssPath, "utf8");
			// Correcting the font URL relative paths in CSS
			// Since result.css assumes its in the same folder as woff2
			// But we'll import it from src/styles
			cssContent = cssContent.replace(/url\(['"]?([^'"]+)['"]?\)/g, (match, url) => {
				if (!url.startsWith("http") && !url.startsWith("/")) {
					return `url('/fonts/zhuque/${url}')`;
				}
				return match;
			});

			fs.writeFileSync(GENERATED_CSS_PATH, cssContent, "utf8");
			console.log("[Font-Split] Generated and optimized: src/styles/generated-zhuque-font.css");
		}

		console.log("[Font-Split] Slicing completed successfully.");
	} catch (error) {
		console.error("[Font-Split] Failed:", error);
		process.exit(1);
	}
}

main();
