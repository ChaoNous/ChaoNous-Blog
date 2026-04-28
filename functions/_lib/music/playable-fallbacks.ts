export type ResolvedPlayableTrack = {
  url: string;
  name?: string;
  artist?: string;
  pic?: string;
  duration?: number;
};

export type NeteaseSongFallback = Omit<ResolvedPlayableTrack, "url"> & {
  kind: "netease-song";
  songId: number;
};

export type DirectPreviewFallback = ResolvedPlayableTrack & {
  kind: "direct-preview";
};

export type DeezerPreviewFallback = {
  kind: "deezer-preview";
  term: string;
  expectedTrack: string;
  expectedArtist: string;
  name?: string;
  artist?: string;
  pic?: string;
  duration?: number;
};

export type MusicPlayableFallback =
  | NeteaseSongFallback
  | DirectPreviewFallback
  | DeezerPreviewFallback;

type DeezerSearchPayload = {
  data?: Array<{
    title?: string;
    preview?: string;
    artist?: {
      name?: string;
    };
    album?: {
      cover_medium?: string;
      cover_xl?: string;
    };
  }>;
};

const PREVIEW_DURATION_MS = 30_000;

// The configured NetEase playlist contains several tracks that no longer expose
// public audio URLs. Keep explicit, reviewed fallbacks here instead of guessing.
const MUSIC_PLAYABLE_FALLBACKS = new Map<number, MusicPlayableFallback>([
  [
    1417453801,
    {
      kind: "netease-song",
      songId: 2030641887,
      name: "\u5929\u6daf",
      artist: "\u79cb\u5c71\u679d\u679d",
      pic: "https://p1.music.126.net/gDoTbzFHBWcuGB6hJn3R7Q==/109951165566056109.jpg",
      duration: 254000,
    },
  ],
  [
    33789445,
    {
      kind: "netease-song",
      songId: 31260546,
      name: "\u957f\u5b89\u96c6\u5e02",
      artist: "\u7fa4\u661f",
      pic: "https://p1.music.126.net/Oa2QHByL-f14TRsgIeLG2w==/7817527674131673.jpg",
      duration: 142000,
    },
  ],
  [
    1817410059,
    {
      kind: "netease-song",
      songId: 2601597800,
      name: "\u5c18\u4e16\u95f2\u6e38 Rex Incognito",
      artist: "\u4e30\u7fbd",
      pic: "https://p1.music.126.net/fiOaPXaw5xPvHHNorNKtjg==/109951169294915348.jpg",
      duration: 105500,
    },
  ],
  [
    441120082,
    {
      kind: "direct-preview",
      name: "China (The Atomic Era)",
      artist: "Geoff Knorr & Phill Boucher",
      duration: PREVIEW_DURATION_MS,
      url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2a/4d/14/2a4d141e-3ffb-4411-22f7-bfe85fd701e2/mzaf_9533912929281900647.plus.aac.p.m4a",
    },
  ],
  [
    417594093,
    {
      kind: "direct-preview",
      name: "\u963f\u91cc\u90ce (\u7b1b\u5b50\u72ec\u594f)",
      artist: "\u674e\u4e50\u8431",
      duration: PREVIEW_DURATION_MS,
      url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/13/97/1b/13971b18-b216-2aef-ccad-95b82598b974/mzaf_10658465002001041000.plus.aac.p.m4a",
    },
  ],
  [
    3319151600,
    {
      kind: "deezer-preview",
      term: "Flower Gardens Magnus Ringblom Crusader Kings III",
      expectedTrack: "Flower Gardens",
      expectedArtist: "Magnus Ringblom",
      name: "Flower Gardens",
      artist: "Magnus Ringblom",
      duration: PREVIEW_DURATION_MS,
    },
  ],
  [
    29722369,
    {
      kind: "direct-preview",
      name: "The Stone Masons",
      artist: "Andreas Waldetoft",
      duration: PREVIEW_DURATION_MS,
      url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/78/ca/5f/78ca5fc0-b0b4-ee35-7567-5eb8b9c4b97c/mzaf_3722198970547995839.plus.aac.p.m4a",
    },
  ],
]);

function normalizeComparableText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s'"()[\]{}.,:;!?/_-]+/g, "");
}

function matchesExpectedText(
  actual: string | undefined,
  expected: string,
): boolean {
  const normalizedActual = normalizeComparableText(actual);
  const normalizedExpected = normalizeComparableText(expected);

  if (!normalizedActual || !normalizedExpected) {
    return false;
  }

  return (
    normalizedActual === normalizedExpected ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  );
}

export function getMusicPlayableFallback(
  trackId: number,
): MusicPlayableFallback | null {
  return MUSIC_PLAYABLE_FALLBACKS.get(trackId) ?? null;
}

export async function resolveDeezerPreviewFallback(
  fallback: DeezerPreviewFallback,
): Promise<ResolvedPlayableTrack | null> {
  const url = new URL("https://api.deezer.com/search");
  url.searchParams.set("q", fallback.term);
  url.searchParams.set("limit", "10");

  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as DeezerSearchPayload;
  const match = (payload.data ?? []).find((result) => {
    return (
      result.preview &&
      matchesExpectedText(result.title, fallback.expectedTrack) &&
      matchesExpectedText(result.artist?.name, fallback.expectedArtist)
    );
  });

  if (!match?.preview) {
    return null;
  }

  return {
    url: match.preview,
    name: fallback.name ?? match.title,
    artist: fallback.artist ?? match.artist?.name,
    pic: fallback.pic ?? match.album?.cover_xl ?? match.album?.cover_medium,
    duration: fallback.duration ?? PREVIEW_DURATION_MS,
  };
}
