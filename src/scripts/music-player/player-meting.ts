import { createSong, type Song } from "./player-types";

interface FetchMetingPlaylistSongsOptions {
  apiTemplate: string;
  id: string;
  server: string;
  type: string;
  unknownSongLabel: string;
  unknownArtistLabel: string;
}

export async function fetchMetingPlaylistSongs(
  options: FetchMetingPlaylistSongsOptions,
): Promise<Song[]> {
  const {
    apiTemplate,
    id,
    server,
    type,
    unknownSongLabel,
    unknownArtistLabel,
  } = options;

  const apiUrl = apiTemplate
    .replace(":server", server)
    .replace(":type", type)
    .replace(":id", id)
    .replace(":auth", "")
    .replace(":r", Date.now().toString());

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("meting api error");
  }

  const list = await response.json();
  return list.map((song: any) => {
    let title = song.name ?? song.title ?? unknownSongLabel;
    let artist = song.artist ?? song.author ?? unknownArtistLabel;
    let duration = song.duration ?? 0;
    if (duration > 10000) duration = Math.floor(duration / 1000);
    if (!Number.isFinite(duration) || duration <= 0) duration = 0;

    return createSong({
      id: song.id,
      title,
      artist,
      cover: song.pic ?? "",
      url: song.url ?? "",
      duration,
    });
  });
}
