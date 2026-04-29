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

const STATIC_NETEASE_PLAYLISTS = new Map<string, UpstreamTrack[]>([
  [
    "13556055400",
    [
      {
        id: 1417453801,
        name: "\u5929\u6daf",
        artists: [{ name: "\u5f6d\u7b54\uff08\u7b54\u7b54\uff09" }],
        album: {
          picUrl:
            "https://p2.music.126.net/dJYDn4g8Bg-QaNNjT_GV4g==/109951164635341476.jpg",
        },
        duration: 82383,
      },
      {
        id: 33789445,
        name: "\u957f\u5b89",
        artists: [{ name: "\u7fa4\u661f" }],
        album: {
          picUrl:
            "https://p2.music.126.net/ha8VMt0hPiuidPxPImbBWQ==/7982454419372972.jpg",
        },
        duration: 154128,
      },
      {
        id: 1817410059,
        name: "\u5c18\u4e16\u95f2\u6e38 Rex Incognito",
        artists: [{ name: "\u9648\u81f4\u9038" }, { name: "HOYO-MiX" }],
        album: {
          picUrl:
            "https://p2.music.126.net/hwxZS2Bv9Dht_8chjLLR-Q==/109951165690591384.jpg",
        },
        duration: 108827,
      },
      {
        id: 441120082,
        name: "China (The Atomic Era)",
        artists: [{ name: "Geoff Knorr" }],
        album: {
          picUrl:
            "https://p2.music.126.net/VgiTkud1GVT8kGJM53hfvw==/18815942487303147.jpg",
        },
        duration: 199281,
      },
      {
        id: 417594093,
        name: "\u963f\u91cc\u90ce\uff08\u7eaf\u97f3\u4e50\uff09",
        artists: [{ name: "SaxyBar" }],
        album: {
          picUrl:
            "https://p2.music.126.net/nZ1nCYSWO5MVvylNNJ4EoA==/18030891183939033.jpg",
        },
        duration: 127002,
      },
      {
        id: 3319151600,
        name: "Flower Gardens",
        artists: [{ name: "Magnus Ringblom" }],
        album: {
          picUrl:
            "https://p2.music.126.net/rEqVqZnjOmfWiD40HdrYHA==/109951172306592526.jpg",
        },
        duration: 178200,
      },
      {
        id: 1357785684,
        name: "\u60ca\u9e3f",
        artists: [{ name: "Forbearance ye" }],
        album: {
          picUrl:
            "https://p2.music.126.net/Daz0Z7zeSkJvwhu-TQbN1A==/109951163988273611.jpg",
        },
        duration: 150000,
      },
      {
        id: 29722369,
        name: "The Stonemasons (From the Europa Universalis IV Soundtrack)",
        artists: [
          { name: "Paradox Interactive" },
          { name: "Andreas Waldetoft" },
        ],
        album: {
          picUrl:
            "https://p2.music.126.net/Q3s90qB6VYpbonkBOubFhg==/109951164071976757.jpg",
        },
        duration: 232381,
      },
    ],
  ],
]);

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

  const artist = getArtistNames(track);

  return {
    id,
    name: track.name?.trim() || "Unknown Song",
    artist: artist || "Unknown Artist",
    author: artist || "Unknown Artist",
    pic: getCoverUrl(track),
    url:
      playableUrls.get(id) ??
      `https://music.163.com/song/media/outer/url?id=${id}.mp3`,
    duration: getTrackDuration(track),
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

async function resolvePlayableUrls(
  tracks: UpstreamTrack[],
): Promise<Map<number, string>> {
  const trackIds = tracks.map(getTrackId).filter((id) => id > 0);

  try {
    return await fetchNeteasePlayableUrls(trackIds);
  } catch (error) {
    console.error("music.playlist.playable_urls", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Map();
  }
}

function getStaticPlaylistTracks(playlistId: string): UpstreamTrack[] {
  return STATIC_NETEASE_PLAYLISTS.get(playlistId) ?? [];
}

export async function fetchNeteasePlaylistTracks(
  playlistId: string,
): Promise<MusicTrack[]> {
  const upstreamUrl = new URL("https://music.163.com/api/playlist/detail");
  upstreamUrl.searchParams.set("id", playlistId);

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        accept: "application/json, text/plain, */*",
        referer: "https://music.163.com/",
      },
    });
  } catch (error) {
    const staticTracks = getStaticPlaylistTracks(playlistId);
    if (staticTracks.length > 0) {
      console.error("music.playlist.static_fallback", {
        playlistId,
        error: error instanceof Error ? error.message : String(error),
      });
      const playableUrls = await resolvePlayableUrls(staticTracks);
      return staticTracks
        .map((track) => mapTrack(track, playableUrls))
        .filter(isMusicTrack);
    }

    throw error;
  }

  if (!upstreamResponse.ok) {
    const staticTracks = getStaticPlaylistTracks(playlistId);
    if (staticTracks.length > 0) {
      const playableUrls = await resolvePlayableUrls(staticTracks);
      return staticTracks
        .map((track) => mapTrack(track, playableUrls))
        .filter(isMusicTrack);
    }

    throw new MusicUpstreamResponseError(upstreamResponse.status);
  }

  const payload = (await upstreamResponse.json()) as UpstreamPlaylistPayload;
  const upstreamTracks = payload.result?.tracks ?? [];
  const tracks =
    upstreamTracks.length > 0
      ? upstreamTracks
      : getStaticPlaylistTracks(playlistId);
  const playableUrls = await resolvePlayableUrls(tracks);

  return tracks
    .map((track) => mapTrack(track, playableUrls))
    .filter(isMusicTrack);
}
