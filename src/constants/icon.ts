import type { Favicon } from "@/types/config.ts";

export const defaultFavicons: Favicon[] = [
	{
		src: "/favicon/favicon.png",
		theme: "light",
		sizes: "512x512",
	},
	{
		src: "/favicon/favicon.png",
		theme: "dark",
		sizes: "512x512",
	},
];
