type RequestContext = {
  request: Request;
};

type MusicApiErrorCode =
  | "BAD_REQUEST"
  | "UNSUPPORTED_SOURCE"
  | "UPSTREAM_ERROR";

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

function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function errorResponse(
  status: number,
  code: MusicApiErrorCode,
  message: string,
): Response {
  return json(
    {
      ok: false,
      code,
      message,
    },
    status,
    {
      "cache-control": "no-store",
    },
  );
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

function mapTrack(track: UpstreamTrack) {
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

export const onRequestGet = async ({ request }: RequestContext) => {
  const url = new URL(request.url);
  const server = url.searchParams.get("server")?.trim() ?? "";
  const type = url.searchParams.get("type")?.trim() ?? "";
  const playlistId = url.searchParams.get("id")?.trim() ?? "";

  if (!playlistId) {
    return errorResponse(400, "BAD_REQUEST", "Missing playlist id.");
  }

  if (server !== "netease" || type !== "playlist") {
    return errorResponse(
      400,
      "UNSUPPORTED_SOURCE",
      "Only netease playlist requests are supported.",
    );
  }

  const upstreamUrl = new URL("https://music.163.com/api/playlist/detail");
  upstreamUrl.searchParams.set("id", playlistId);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        accept: "application/json, text/plain, */*",
        referer: "https://music.163.com/",
      },
    });

    if (!upstreamResponse.ok) {
      return errorResponse(
        502,
        "UPSTREAM_ERROR",
        `Music upstream returned ${upstreamResponse.status}.`,
      );
    }

    const payload = (await upstreamResponse.json()) as UpstreamPlaylistPayload;
    const tracks = payload.result?.tracks ?? [];
    const songs = tracks.map(mapTrack).filter(Boolean);

    return json(songs, 200, {
      "cache-control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    });
  } catch (error) {
    console.error("music:playlist", error);
    return errorResponse(
      502,
      "UPSTREAM_ERROR",
      "Failed to fetch playlist from music upstream.",
    );
  }
};
