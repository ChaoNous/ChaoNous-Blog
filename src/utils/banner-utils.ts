export type BannerSource = string | string[];

export type BannerSourceConfig =
  | BannerSource
  | {
      desktop?: BannerSource;
      mobile?: BannerSource;
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
): Promise<ResolvedBannerImages> {
  const bannerSrc = source;

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
    typeof bannerSrc === "string" || Array.isArray(bannerSrc) ? bannerSrc : "";
  return {
    desktop: sharedBannerSrc,
    mobile: sharedBannerSrc,
  };
}
