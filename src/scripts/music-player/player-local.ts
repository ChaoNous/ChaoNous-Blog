import { createSong, type Song } from "./player-types";

export function buildLocalPlaylist(hitoriCover: string): Song[] {
	return [
		createSong({
			id: 1,
			title: "Hitori no Uta",
			artist: "Kaya",
			cover: hitoriCover,
			url: "assets/music/url/hitori.mp3",
			duration: 240,
		}),
		createSong({
			id: 2,
			title: "Xing Ri Yu Xing",
			artist: "Stereo Dive Foundation",
			cover: "assets/music/cover/xryx.webp",
			url: "assets/music/url/xryx.mp3",
			duration: 180,
		}),
		createSong({
			id: 3,
			title: "Chun Lei",
			artist: "22/7",
			cover: "assets/music/cover/cl.webp",
			url: "assets/music/url/cl.mp3",
			duration: 200,
		}),
	];
}

export function getLoadingSong(
	mode: string,
	localPlaylist: Song[],
	loadingLabel: string,
	unknownArtistLabel: string,
): Song {
	if (mode === "local" && localPlaylist.length > 0) {
		return { ...localPlaylist[0] };
	}

	return createSong({
		title: loadingLabel,
		artist: unknownArtistLabel,
	});
}
