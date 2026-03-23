/**
 * 图片压缩脚本 - 使用 sharp 压缩大图片
 * 运行: node scripts/compress-images.js
 */

import sharp from "sharp";
import { existsSync, statSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// 需要压缩的图片列表（超过 200KB 的图片）
const imagesToCompress = [
	{ path: "src/content/posts/guide/cover.webp", maxSize: 200 },
	{ path: "src/assets/home/text-logo.webp", maxSize: 100 },
	{ path: "src/assets/posts/jingdezhen/jingdezhen-3.webp", maxSize: 200 },
	{ path: "src/assets/posts/jingdezhen/jingdezhen-2.webp", maxSize: 200 },
	{ path: "src/assets/posts/jingdezhen/jingdezhen-1.webp", maxSize: 200 },
	{ path: "src/assets/desktop-banner/banner1.webp", maxSize: 150 },
	{ path: "src/assets/desktop-banner/banner2.webp", maxSize: 100 },
	{ path: "src/assets/desktop-banner/banner4.webp", maxSize: 100 },
	{ path: "src/assets/mobile-banner/banner1.webp", maxSize: 150 },
	{ path: "src/assets/mobile-banner/banner2.webp", maxSize: 100 },
	{ path: "src/assets/mobile-banner/banner4.webp", maxSize: 100 },
	{ path: "src/assets/home/home.webp", maxSize: 150 },
	{ path: "public/images/diary/1.jpg", maxSize: 200 },
];

async function compressImage(imagePath, maxKB) {
	const fullPath = join(rootDir, imagePath);

	if (!existsSync(fullPath)) {
		console.log(`⚠️ 文件不存在: ${imagePath}`);
		return null;
	}

	const originalStat = statSync(fullPath);
	const originalKB = originalStat.size / 1024;

	if (originalKB <= maxKB) {
		console.log(
			`✅ 已达标: ${imagePath} (${originalKB.toFixed(1)}KB ≤ ${maxKB}KB)`,
		);
		return { skipped: true };
	}

	try {
		const ext = extname(imagePath).toLowerCase();
		let image = sharp(fullPath);
		const metadata = await image.metadata();

		// 根据图片类型设置压缩选项
		let compressed;
		if (ext === ".webp") {
			compressed = await image
				.webp({
					quality: 75,
					effort: 6,
					lossless: false,
				})
				.toBuffer();
		} else if (ext === ".jpg" || ext === ".jpeg") {
			compressed = await image
				.jpeg({
					quality: 75,
					mozjpeg: true,
				})
				.toBuffer();
		} else if (ext === ".png") {
			compressed = await image
				.png({
					quality: 75,
					compressionLevel: 9,
				})
				.toBuffer();
		} else {
			console.log(`⚠️ 不支持的格式: ${imagePath}`);
			return null;
		}

		const compressedKB = compressed.length / 1024;

		// 如果压缩后还是太大，降低质量再试
		if (compressedKB > maxKB) {
			const quality = Math.max(
				50,
				Math.floor(75 * (maxKB / compressedKB)),
			);
			image = sharp(fullPath);

			if (ext === ".webp") {
				compressed = await image
					.webp({ quality, effort: 6 })
					.toBuffer();
			} else if (ext === ".jpg" || ext === ".jpeg") {
				compressed = await image
					.jpeg({ quality, mozjpeg: true })
					.toBuffer();
			}
		}

		const finalKB = compressed.length / 1024;

		// 只有压缩后有显著减少才保存
		if (finalKB < originalKB * 0.95) {
			await writeFile(fullPath, compressed);
			const saved = originalKB - finalKB;
			const percent = ((saved / originalKB) * 100).toFixed(1);
			console.log(
				`✅ ${imagePath}: ${originalKB.toFixed(1)}KB → ${finalKB.toFixed(1)}KB (节省 ${percent}%)`,
			);
			return { originalKB, finalKB, saved, percent };
		} else {
			console.log(`⚠️ 压缩效果不明显: ${imagePath}`);
			return null;
		}
	} catch (error) {
		console.error(`❌ 压缩失败 ${imagePath}:`, error.message);
		return null;
	}
}

async function main() {
	console.log("🖼️ 开始压缩图片...\n");

	let totalSaved = 0;
	let compressedCount = 0;

	for (const img of imagesToCompress) {
		const result = await compressImage(img.path, img.maxSize);
		if (result && !result.skipped) {
			totalSaved += result.saved;
			compressedCount++;
		}
	}

	console.log(`\n📊 压缩完成!`);
	console.log(`   压缩了 ${compressedCount} 张图片`);
	console.log(`   总共节省 ${(totalSaved / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
