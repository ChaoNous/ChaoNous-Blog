const SVG_SIZE = 96;

function getInitial(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) return "匿";
	return Array.from(trimmed)[0] || "匿";
}

function toHue(seed: string): number {
	let total = 0;
	for (let index = 0; index < seed.length; index += 1) {
		total = (total + seed.charCodeAt(index) * (index + 17)) % 360;
	}
	return total;
}

function buildSvg(seed: string, name: string): string {
	const hue = toHue(seed);
	const initial = getInitial(name);
	const gradientStart = `oklch(0.78 0.11 ${hue})`;
	const gradientEnd = `oklch(0.66 0.14 ${(hue + 42) % 360})`;
	const accent = `oklch(0.92 0.03 ${hue})`;
	const textColor = `oklch(0.24 0.03 ${hue})`;

	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_SIZE}" height="${SVG_SIZE}" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" fill="none">
  <defs>
    <linearGradient id="avatar-gradient" x1="10" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${gradientStart}" />
      <stop offset="100%" stop-color="${gradientEnd}" />
    </linearGradient>
  </defs>
  <rect width="${SVG_SIZE}" height="${SVG_SIZE}" rx="48" fill="url(#avatar-gradient)" />
  <circle cx="70" cy="26" r="9" fill="${accent}" fill-opacity="0.65" />
  <circle cx="24" cy="72" r="12" fill="${accent}" fill-opacity="0.42" />
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="'Zhuque Fangsong UI', 'Zhuque Fangsong', 'Crimson Pro', serif" font-size="36" fill="${textColor}">${initial}</text>
</svg>`.trim();
}

export const onRequestGet = async ({
	request,
	params,
}: {
	request: Request;
	params: { seed?: string };
}) => {
	const url = new URL(request.url);
	const seed = String(params.seed || "anonymous").trim().toLowerCase() || "anonymous";
	const name = url.searchParams.get("name")?.trim() || "匿名";
	const svg = buildSvg(seed, name);

	return new Response(svg, {
		headers: {
			"content-type": "image/svg+xml; charset=utf-8",
			"cache-control": "public, max-age=31536000, immutable",
		},
	});
};
