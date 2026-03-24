import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fontmin from "fontmin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

const CONFIG_PATH = path.join(ROOT_DIR, "src/config.ts");
const SOURCE_FONT_DIR = path.join(ROOT_DIR, "public/assets/fonts");
const GENERATED_CSS_PATH = path.join(
	ROOT_DIR,
	"src/styles/generated-zhuque-ui-font.css",
);
const UI_FONT_FILE = "ZhuqueFangsong-Regular-UI.woff2";
const LEGACY_PUBLIC_FONT_DIR = path.join(ROOT_DIR, "public/assets/font");
const LEGACY_PUBLIC_WOFF2 = path.join(
	ROOT_DIR,
	"public/assets/fonts/ZhuqueFangsong-Regular.woff2",
);

const TEXT_SOURCES = [
	"src/config.ts",
	"src/content",
	"src/data",
	"src/pages",
	"src/components",
	"src/layouts",
	"src/i18n/languages",
];

const EXTRA_UI_TEXT = [
	"首页",
	"归档",
	"相册",
	"友链",
	"关于",
	"项目",
	"技能",
	"时间线",
	"目录",
	"日历",
	"搜索",
	"设置",
];

function readText(filePath) {
	if (!fs.existsSync(filePath)) return "";
	return fs.readFileSync(filePath, "utf8");
}

function walkFiles(targetPath, result = []) {
	if (!fs.existsSync(targetPath)) return result;

	const stat = fs.statSync(targetPath);
	if (stat.isFile()) {
		result.push(targetPath);
		return result;
	}

	for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
		const fullPath = path.join(targetPath, entry.name);
		if (entry.isDirectory()) {
			walkFiles(fullPath, result);
		} else if (
			/\.(astro|md|mdx|ts|js|json|yml|yaml|svelte|styl|css)$/i.test(
				entry.name,
			)
		) {
			result.push(fullPath);
		}
	}

	return result;
}

function resolveSourceFontFile() {
	const config = readText(CONFIG_PATH);
	const cjkBlock = config.match(/cjkFont:\s*\{([\s\S]*?)\n\t\t\}/);
	const fontMatch = cjkBlock?.[1]?.match(/localFonts:\s*\[\s*"([^"]+)"/);
	return fontMatch?.[1] ?? "ZhuqueFangsong-Regular.ttf";
}

function isCjkOrPunctuation(char) {
	return (
		/[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/u.test(
			char,
		) || /[，。！？；：“”‘’（）《》【】、…—]/u.test(char)
	);
}

function collectTextChars() {
	const chars = new Set();

	for (const source of TEXT_SOURCES) {
		const fullPath = path.join(ROOT_DIR, source);
		const files = walkFiles(fullPath);
		for (const filePath of files) {
			const content = readText(filePath);
			for (const char of content) {
				if (isCjkOrPunctuation(char)) {
					chars.add(char);
				}
			}
		}
	}

	for (const text of EXTRA_UI_TEXT) {
		for (const char of text) {
			chars.add(char);
		}
	}

	return Array.from(chars).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}

async function collectMetingChars() {
	const chars = new Set();
	const config = readText(CONFIG_PATH);
	const enabled = /musicPlayerConfig:\s*MusicPlayerConfig\s*=\s*\{[\s\S]*?enable:\s*(true|false)/.exec(
		config,
	)?.[1];

	if (enabled !== "true") {
		return chars;
	}

	const api =
		/musicPlayerConfig:\s*MusicPlayerConfig\s*=\s*\{[\s\S]*?meting_api:\s*["']([^"']+)["']/.exec(
			config,
		)?.[1] ??
		"https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
	const id =
		/musicPlayerConfig:\s*MusicPlayerConfig\s*=\s*\{[\s\S]*?id:\s*["']([^"']+)["']/.exec(
			config,
		)?.[1] ?? "13556055400";
	const server =
		/musicPlayerConfig:\s*MusicPlayerConfig\s*=\s*\{[\s\S]*?server:\s*["']([^"']+)["']/.exec(
			config,
		)?.[1] ?? "netease";
	const type =
		/musicPlayerConfig:\s*MusicPlayerConfig\s*=\s*\{[\s\S]*?type:\s*["']([^"']+)["']/.exec(
			config,
		)?.[1] ?? "playlist";

	const apiUrl = api
		.replace(":server", server)
		.replace(":type", type)
		.replace(":id", id)
		.replace(":auth", "")
		.replace(":r", Date.now().toString());

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);
		const response = await fetch(apiUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		});
		clearTimeout(timeoutId);

		if (!response.ok) {
			return chars;
		}

		const playlist = await response.json();
		if (!Array.isArray(playlist)) {
			return chars;
		}

		for (const song of playlist) {
			const songText = `${song?.name ?? ""}${song?.artist ?? song?.author ?? ""}`;
			for (const char of songText) {
				if (isCjkOrPunctuation(char)) {
					chars.add(char);
				}
			}
		}
	} catch {
		// Ignore music metadata fetch failures.
	}

	return chars;
}

function toUnicodeRanges(chars) {
	const codepoints = chars
		.map((char) => char.codePointAt(0))
		.filter((value) => Number.isInteger(value))
		.sort((a, b) => a - b);

	if (codepoints.length === 0) return "";

	const ranges = [];
	let start = codepoints[0];
	let end = codepoints[0];

	for (let i = 1; i < codepoints.length; i++) {
		const current = codepoints[i];
		if (current === end + 1) {
			end = current;
			continue;
		}

		ranges.push([start, end]);
		start = current;
		end = current;
	}

	ranges.push([start, end]);

	return ranges
		.map(([rangeStart, rangeEnd]) => {
			const startHex = rangeStart.toString(16).toUpperCase();
			const endHex = rangeEnd.toString(16).toUpperCase();
			return rangeStart === rangeEnd
				? `U+${startHex}`
				: `U+${startHex}-${endHex}`;
		})
		.join(",\n    ");
}

async function generateSubsetFont(sourceFontPath, outputPath, text) {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zqfs-ui-"));

	try {
		const fontmin = new Fontmin()
			.src(sourceFontPath)
			.use(
				Fontmin.glyph({
					text,
					hinting: false,
				}),
			)
			.use(
				Fontmin.ttf2woff2({
					deflate: true,
				}),
			)
			.dest(tempDir);

		await new Promise((resolve, reject) => {
			fontmin.run((err) => {
				if (err) reject(err);
				else resolve();
			});
		});

		const generatedFile = path.join(
			tempDir,
			`${path.basename(sourceFontPath, path.extname(sourceFontPath))}.woff2`,
		);

		if (!fs.existsSync(generatedFile)) {
			throw new Error(`Subset font not generated: ${generatedFile}`);
		}

		fs.copyFileSync(generatedFile, outputPath);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

function writeGeneratedCss(unicodeRanges) {
	const css = `@font-face {
  font-family: "Zhuque Fangsong UI";
  src: url("/assets/fonts/${UI_FONT_FILE}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range:
    ${unicodeRanges};
}
`;

	fs.writeFileSync(GENERATED_CSS_PATH, css, "utf8");
}

function removeLegacyArtifacts() {
	fs.rmSync(LEGACY_PUBLIC_FONT_DIR, { recursive: true, force: true });
	if (fs.existsSync(LEGACY_PUBLIC_WOFF2)) {
		fs.unlinkSync(LEGACY_PUBLIC_WOFF2);
	}
}

async function main() {
	const sourceFontFile = resolveSourceFontFile();
	const sourceFontPath = path.join(SOURCE_FONT_DIR, sourceFontFile);

	if (!fs.existsSync(sourceFontPath)) {
		console.log(`Skip font compression: source font not found at ${sourceFontPath}`);
		return;
	}

	const chars = new Set(collectTextChars());
	const metingChars = await collectMetingChars();
	for (const char of metingChars) {
		chars.add(char);
	}

	const sortedChars = Array.from(chars).sort(
		(a, b) => a.codePointAt(0) - b.codePointAt(0),
	);
	if (sortedChars.length === 0) {
		console.log("Skip font compression: no CJK characters collected");
		return;
	}

	const unicodeRanges = toUnicodeRanges(sortedChars);
	const subsetText = sortedChars.join("");
	const outputPath = path.join(SOURCE_FONT_DIR, UI_FONT_FILE);

	await generateSubsetFont(sourceFontPath, outputPath, subsetText);
	writeGeneratedCss(unicodeRanges);
	removeLegacyArtifacts();

	const outputSize = fs.statSync(outputPath).size;
	console.log(
		`Generated ${UI_FONT_FILE} (${(outputSize / 1024).toFixed(2)} KB)`,
	);
}

main().catch((error) => {
	console.error("Font compression failed:", error);
	process.exit(1);
});
