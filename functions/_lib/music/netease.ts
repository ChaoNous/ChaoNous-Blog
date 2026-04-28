import type { MusicTrack } from "./types.ts";

type UpstreamArtist = {
  name?: string;
};

type UpstreamAlbum = {
  picUrl?: string;
  blurPicUrl?: string;
};

type UpstreamTrack = {
  id?: number;
  name?: string;
  ar?: UpstreamArtist[];
  artists?: UpstreamArtist[];
  al?: UpstreamAlbum;
  album?: UpstreamAlbum;
  dt?: number;
  duration?: number;
};

type UpstreamPlaylistPayload = {
  result?: {
    tracks?: UpstreamTrack[];
  };
};

type UpstreamSongUrl = {
  id?: number;
  url?: string | null;
  code?: number;
};

type UpstreamSongUrlPayload = {
  data?: UpstreamSongUrl[];
};

export class MusicUpstreamResponseError extends Error {
  readonly upstreamStatus: number;

  constructor(upstreamStatus: number) {
    super(`Music upstream returned ${upstreamStatus}.`);
    this.name = "MusicUpstreamResponseError";
    this.upstreamStatus = upstreamStatus;
  }
}

function getArtistNames(track: UpstreamTrack): string {
  const artists = track.ar ?? track.artists ?? [];

  return artists
    .map((artist) => artist.name?.trim() ?? "")
    .filter(Boolean)
    .join(" / ");
}

function normalizeUrlProtocol(url: string): string {
  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }

  return url;
}

function getCoverUrl(track: UpstreamTrack): string {
  return normalizeUrlProtocol(
    track.al?.picUrl ??
      track.al?.blurPicUrl ??
      track.album?.picUrl ??
      track.album?.blurPicUrl ??
      "",
  );
}

function getTrackDuration(track: UpstreamTrack): number {
  const duration = track.dt ?? track.duration ?? 0;
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

function mapTrack(
  track: UpstreamTrack,
  playableUrls: Map<number, string>,
): MusicTrack | null {
  const id = Number(track.id ?? 0);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const playableUrl = playableUrls.get(id);
  if (!playableUrl) {
    return null;
  }

  const artist = getArtistNames(track);

  return {
    id,
    name: track.name?.trim() || "Unknown Song",
    artist: artist || "Unknown Artist",
    author: artist || "Unknown Artist",
    pic: getCoverUrl(track),
    url: playableUrl,
    duration: getTrackDuration(track),
  };
}

function isMusicTrack(track: MusicTrack | null): track is MusicTrack {
  return track !== null;
}

async function fetchNeteasePlayableUrls(
  trackIds: number[],
): Promise<Map<number, string>> {
  if (trackIds.length === 0) {
    return new Map();
  }

  const url = new URL("https://music.163.com/api/song/enhance/player/url");
  url.searchParams.set("ids", `[${trackIds.join(",")}]`);
  url.searchParams.set("br", "128000");

  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      referer: "https://music.163.com/",
    },
  });

  if (!response.ok) {
    throw new MusicUpstreamResponseError(response.status);
  }

  const payload = (await response.json()) as UpstreamSongUrlPayload;
  const playableUrls = new Map<number, string>();

  for (const songUrl of payload.data ?? []) {
    const id = Number(songUrl.id ?? 0);
    if (!Number.isFinite(id) || id <= 0) {
      continue;
    }

    if (songUrl.code === 200 && songUrl.url) {
      playableUrls.set(id, normalizeUrlProtocol(songUrl.url));
    }
  }

  return playableUrls;
}

export async function fetchNeteasePlaylistTracks(
  playlistId: string,
): Promise<MusicTrack[]> {
  const upstreamUrl = new URL("https://music.163.com/api/playlist/detail");
  upstreamUrl.searchParams.set("id", playlistId);

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      accept: "application/json, text/plain, */*",
      referer: "https://music.163.com/",
    },
  });

  if (!upstreamResponse.ok) {
    throw new MusicUpstreamResponseError(upstreamResponse.status);
  }

  const payload = (await upstreamResponse.json()) as UpstreamPlaylistPayload;
  const tracks = payload.result?.tracks ?? [];
  const trackIds = tracks
    .map((track) => Number(track.id ?? 0))
    .filter((id) => Number.isFinite(id) && id > 0);
  const playableUrls = await fetchNeteasePlayableUrls(trackIds);

  return tracks
    .map((track) => mapTrack(track, playableUrls))
    .filter(isMusicTrack);
}
