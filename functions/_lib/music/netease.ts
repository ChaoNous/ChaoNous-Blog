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

function mapTrack(track: UpstreamTrack): MusicTrack | null {
  const id = Number(track.id ?? 0);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const artist = getArtistNames(track);

  return {
    id,
    name: track.name?.trim() || "Unknown Song",
    artist: artist || "Unknown Artist",
    author: artist || "Unknown Artist",
    pic: getCoverUrl(track),
    url: `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
    duration: getTrackDuration(track),
  };
}

function isMusicTrack(track: MusicTrack | null): track is MusicTrack {
  return track !== null;
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

  return tracks.map(mapTrack).filter(isMusicTrack);
}
