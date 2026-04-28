import type { MusicTrack } from "./types.ts";
import {
  getMusicPlayableFallback,
  resolveDeezerPreviewFallback,
  type MusicPlayableFallback,
  type ResolvedPlayableTrack,
} from "./playable-fallbacks.ts";

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
  playableTracks: Map<number, ResolvedPlayableTrack>,
): MusicTrack | null {
  const id = Number(track.id ?? 0);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const playableTrack = playableTracks.get(id);
  if (!playableTrack?.url) {
    return null;
  }

  const artist = getArtistNames(track);
  const resolvedArtist = playableTrack.artist ?? artist;

  return {
    id,
    name: playableTrack.name ?? track.name?.trim() ?? "Unknown Song",
    artist: resolvedArtist || "Unknown Artist",
    author: resolvedArtist || "Unknown Artist",
    pic: playableTrack.pic ?? getCoverUrl(track),
    url: playableTrack.url,
    duration: playableTrack.duration ?? getTrackDuration(track),
  };
}

function isMusicTrack(track: MusicTrack | null): track is MusicTrack {
  return track !== null;
}

async function fetchNeteasePlayableUrls(
  trackIds: number[],
): Promise<Map<number, string>> {
  const uniqueTrackIds = [...new Set(trackIds)];
  if (uniqueTrackIds.length === 0) {
    return new Map();
  }

  const url = new URL("https://music.163.com/api/song/enhance/player/url");
  url.searchParams.set("ids", `[${uniqueTrackIds.join(",")}]`);
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

function getTrackId(track: UpstreamTrack): number {
  const id = Number(track.id ?? 0);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

async function resolvePreviewFallback(
  fallback: MusicPlayableFallback,
): Promise<ResolvedPlayableTrack | null> {
  if (fallback.kind === "direct-preview") {
    return fallback;
  }

  if (fallback.kind === "deezer-preview") {
    return resolveDeezerPreviewFallback(fallback);
  }

  return null;
}

async function resolvePlayableTracks(
  tracks: UpstreamTrack[],
): Promise<Map<number, ResolvedPlayableTrack>> {
  const trackIds = tracks.map(getTrackId).filter((id) => id > 0);
  const playableUrls = await fetchNeteasePlayableUrls(trackIds);
  const playableTracks = new Map<number, ResolvedPlayableTrack>();

  for (const [trackId, url] of playableUrls) {
    playableTracks.set(trackId, { url });
  }

  const missingFallbacks = new Map<number, MusicPlayableFallback>();
  for (const track of tracks) {
    const trackId = getTrackId(track);
    if (trackId <= 0 || playableTracks.has(trackId)) {
      continue;
    }

    const fallback = getMusicPlayableFallback(trackId);
    if (fallback) {
      missingFallbacks.set(trackId, fallback);
    }
  }

  const fallbackSongIds = [...missingFallbacks.values()]
    .filter((fallback) => fallback.kind === "netease-song")
    .map((fallback) => fallback.songId);
  const fallbackPlayableUrls = await fetchNeteasePlayableUrls(fallbackSongIds);

  const previewFallbacks = await Promise.all(
    [...missingFallbacks].map(async ([trackId, fallback]) => {
      return [trackId, await resolvePreviewFallback(fallback)] as const;
    }),
  );

  for (const [trackId, fallback] of missingFallbacks) {
    if (fallback.kind !== "netease-song") {
      continue;
    }

    const url = fallbackPlayableUrls.get(fallback.songId);
    if (url) {
      playableTracks.set(trackId, { ...fallback, url });
    }
  }

  for (const [trackId, fallbackTrack] of previewFallbacks) {
    if (fallbackTrack?.url) {
      playableTracks.set(trackId, fallbackTrack);
    }
  }

  return playableTracks;
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
  const playableTracks = await resolvePlayableTracks(tracks);

  return tracks
    .map((track) => mapTrack(track, playableTracks))
    .filter(isMusicTrack);
}
