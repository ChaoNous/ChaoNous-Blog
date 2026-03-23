import * as fs from "node:fs";
import * as path from "node:path";
import type { AlbumGroup, Photo } from "../types/album";

const ALBUMS_DIR = path.join(process.cwd(), "public/images/albums");
const COVER_FILE_NAME = "cover.jpg";
const IMAGE_EXTENSIONS = new Set([
	".jpg",
	".jpeg",
	".png",
	".gif",
	".webp",
	".svg",
	".avif",
	".bmp",
	".tiff",
	".tif",
]);

interface ExternalPhotoInfo {
	id?: string;
	src?: string;
	thumbnail?: string;
	alt?: string;
	title?: string;
	description?: string;
	tags?: string[];
	date?: string;
	location?: string;
	width?: number;
	height?: number;
}

interface AlbumInfo {
	mode?: "external";
	hidden?: boolean;
	title?: string;
	description?: string;
	date?: string;
	location?: string;
	tags?: string[];
	layout?: AlbumGroup["layout"];
	columns?: number;
	cover?: string;
	photos?: ExternalPhotoInfo[];
}

export async function scanAlbums(): Promise<AlbumGroup[]> {
	if (!fs.existsSync(ALBUMS_DIR)) {
		return [];
	}

	const albumFolders = fs
		.readdirSync(ALBUMS_DIR, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	const albums = await Promise.all(
		albumFolders.map((folderName) =>
			processAlbumFolder(path.join(ALBUMS_DIR, folderName), folderName),
		),
	);

	return albums.filter((album): album is AlbumGroup => album !== null);
}

async function processAlbumFolder(
	folderPath: string,
	folderName: string,
): Promise<AlbumGroup | null> {
	const infoPath = path.join(folderPath, "info.json");

	if (!fs.existsSync(infoPath)) {
		console.warn(`Album ${folderName} is missing info.json`);
		return null;
	}

	const info = readAlbumInfo(infoPath, folderName);
	if (!info || info.hidden) {
		return null;
	}

	const albumAssets =
		info.mode === "external"
			? resolveExternalAlbum(info, folderName)
			: resolveLocalAlbum(folderPath, folderName);

	if (!albumAssets) {
		return null;
	}

	return {
		id: folderName,
		title: info.title || folderName,
		description: info.description || "",
		cover: albumAssets.cover,
		date: info.date || new Date().toISOString().split("T")[0],
		location: info.location || "",
		tags: Array.isArray(info.tags) ? info.tags : [],
		layout: info.layout || "grid",
		columns: info.columns || 3,
		photos: albumAssets.photos,
	};
}

function readAlbumInfo(infoPath: string, folderName: string): AlbumInfo | null {
	try {
		return JSON.parse(fs.readFileSync(infoPath, "utf-8")) as AlbumInfo;
	} catch (error) {
		console.error(`Album ${folderName} has invalid info.json`, error);
		return null;
	}
}

function resolveExternalAlbum(
	info: AlbumInfo,
	folderName: string,
): { cover: string; photos: Photo[] } | null {
	if (!info.cover) {
		console.warn(`Album ${folderName} is missing the external cover field`);
		return null;
	}

	return {
		cover: info.cover,
		photos: processExternalPhotos(info.photos || [], folderName),
	};
}

function resolveLocalAlbum(
	folderPath: string,
	folderName: string,
): { cover: string; photos: Photo[] } | null {
	const coverPath = path.join(folderPath, COVER_FILE_NAME);

	if (!fs.existsSync(coverPath)) {
		console.warn(`Album ${folderName} is missing ${COVER_FILE_NAME}`);
		return null;
	}

	return {
		cover: `/images/albums/${folderName}/${COVER_FILE_NAME}`,
		photos: scanPhotos(folderPath, folderName),
	};
}

function scanPhotos(folderPath: string, albumId: string): Photo[] {
	return fs
		.readdirSync(folderPath)
		.filter((file) => {
			const ext = path.extname(file).toLowerCase();
			return IMAGE_EXTENSIONS.has(ext) && file !== COVER_FILE_NAME;
		})
		.map((file, index) => {
			const filePath = path.join(folderPath, file);
			const stats = fs.statSync(filePath);
			const { baseName, tags } = parseFileName(file);

			return {
				id: `${albumId}-photo-${index}`,
				src: `/images/albums/${albumId}/${file}`,
				alt: baseName,
				title: baseName,
				tags,
				date: stats.mtime.toISOString().split("T")[0],
			};
		});
}

function processExternalPhotos(
	externalPhotos: ExternalPhotoInfo[],
	albumId: string,
): Photo[] {
	return externalPhotos.flatMap((photo, index) => {
		if (!photo.src) {
			console.warn(
				`Album ${albumId} photo ${index + 1} is missing the src field`,
			);
			return [];
		}

		return [
			{
				id: photo.id || `${albumId}-external-photo-${index}`,
				src: photo.src,
				thumbnail: photo.thumbnail,
				alt: photo.alt || photo.title || `Photo ${index + 1}`,
				title: photo.title,
				description: photo.description,
				tags: Array.isArray(photo.tags) ? photo.tags : [],
				date: photo.date || new Date().toISOString().split("T")[0],
				location: photo.location,
				width: photo.width,
				height: photo.height,
			},
		];
	});
}

function parseFileName(fileName: string): { baseName: string; tags: string[] } {
	const parts = path.basename(fileName, path.extname(fileName)).split("_");

	if (parts.length > 1) {
		return {
			baseName: parts.slice(0, -2).join("_"),
			tags: parts.slice(-2),
		};
	}

	return {
		baseName: path.basename(fileName, path.extname(fileName)),
		tags: [],
	};
}
