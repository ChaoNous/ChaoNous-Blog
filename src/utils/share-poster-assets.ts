import path from "node:path";

type SharePosterImageOptions = {
	src?: string;
	basePath?: string;
};

const isLocalAsset = (src: string) =>
	!(
		src.startsWith("/") ||
		src.startsWith("http://") ||
		src.startsWith("https://") ||
		src.startsWith("data:")
	);

export async function resolveSharePosterImage({
	src,
	basePath = "",
}: SharePosterImageOptions): Promise<string | undefined> {
	if (!src) {
		return src;
	}

	if (isLocalAsset(src)) {
		const files = import.meta.glob<ImageMetadata>("../**", {
			import: "default",
		});
		const normalizedPath = path
			.normalize(path.join("../", basePath, src))
			.replace(/\\/g, "/");
		const file = files[normalizedPath];

		if (!file) {
			return src;
		}

		const image = await file();
		return image.src;
	}

	if (src.startsWith("http://") || src.startsWith("https://")) {
		try {
			const response = await fetch(src);
			const arrayBuffer = await response.arrayBuffer();
			const base64 = Buffer.from(arrayBuffer).toString("base64");
			const contentType =
				response.headers.get("content-type") || "image/jpeg";

			return `data:${contentType};base64,${base64}`;
		} catch {
			return src;
		}
	}

	return src;
}
