import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const DIRECTORIES_TO_SCAN = [
	path.join(process.cwd(), 'public'),
	path.join(process.cwd(), 'src/assets')
];

const EXTENSIONS = ['.jpg', '.jpeg', '.png'];

async function processDirectory(dir) {
	try {
		const files = await fs.readdir(dir);
		for (const file of files) {
			const fullPath = path.join(dir, file);
			const stat = await fs.stat(fullPath);

			if (stat.isDirectory()) {
				await processDirectory(fullPath);
			} else if (EXTENSIONS.includes(path.extname(fullPath).toLowerCase())) {
				await compressToWebp(fullPath);
			}
		}
	} catch (error) {
		if (error.code !== 'ENOENT') {
			console.error(`Error processing directory ${dir}:`, error);
		}
	}
}

async function compressToWebp(filePath) {
	const dir = path.dirname(filePath);
	const ext = path.extname(filePath);
	const basename = path.basename(filePath, ext);
	const outputPath = path.join(dir, `${basename}.webp`);

	try {
		// Check if webp version already exists and is newer
		try {
			const sourceStat = await fs.stat(filePath);
			const outStat = await fs.stat(outputPath);
			if (outStat.mtime > sourceStat.mtime) {
				return; // Already compressed and up to date
			}
		} catch (e) {
			// Webp doesn't exist, proceed to generate
		}

		console.log(`Compressing ${filePath} to webp...`);
		await sharp(filePath)
			.webp({ quality: 80, effort: 6 }) // High effort for better compression
			.toFile(outputPath);

		const originalSize = (await fs.stat(filePath)).size;
		const newSize = (await fs.stat(outputPath)).size;
		const savings = ((originalSize - newSize) / originalSize * 100).toFixed(2);
		
		console.log(`\x1b[32m✔ Simplified ${basename}${ext} -> ${basename}.webp (Saved ${savings}%)\x1b[0m`);
	} catch (error) {
		console.error(`\x1b[31m✖ Failed to compress ${filePath}:\x1b[0m`, error);
	}
}

async function main() {
	console.log('\x1b[36mStarting image compression pipeline...\x1b[0m');
	
	for (const dir of DIRECTORIES_TO_SCAN) {
		await processDirectory(dir);
	}
	
	console.log('\x1b[36mImage compression finished!\x1b[0m');
	console.log('NOTE: Ensure you update your markdown files and configurations to use the new .webp extensions!');
}

main();
