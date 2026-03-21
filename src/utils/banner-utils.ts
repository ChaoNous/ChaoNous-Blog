export type BannerSource = string | string[];

export type BannerSourceConfig =
	| BannerSource
	| {
			desktop?: BannerSource;
			mobile?: BannerSource;
	  };

export type BannerImageApiConfig = {
	enable?: boolean;
	url?: string;
};

export type ResolvedBannerImages = {
	desktop: BannerSource;
	mobile: BannerSource;
};

export function normalizeBannerSources(
	source: BannerSource | undefined,
): string[] {
	if (!source) return [];
	return Array.isArray(source) ? source.filter(Boolean) : [source];
}

export async function resolveBannerImages(
	source: BannerSourceConfig,
	imageApi?: BannerImageApiConfig,
): Promise<ResolvedBannerImages> {
	let bannerSrc = source;

	if (imageApi?.enable && imageApi.url) {
		try {
			const response = await fetch(imageApi.url);
			const text = await response.text();
			const apiImages = text.split("\n").filter((line) => line.trim());

			if (apiImages.length > 0) {
				bannerSrc = apiImages;
			}
		} catch (error) {
			console.warn("Failed to fetch images from API:", error);
		}
	}

	if (
		typeof bannerSrc === "object" &&
		bannerSrc !== null &&
		!Array.isArray(bannerSrc) &&
		("desktop" in bannerSrc || "mobile" in bannerSrc)
	) {
		return {
			desktop: bannerSrc.desktop || bannerSrc.mobile || "",
			mobile: bannerSrc.mobile || bannerSrc.desktop || "",
		};
	}

	const sharedBannerSrc =
		typeof bannerSrc === "string" || Array.isArray(bannerSrc)
			? bannerSrc
			: "";
	return {
		desktop: sharedBannerSrc,
		mobile: sharedBannerSrc,
	};
}
