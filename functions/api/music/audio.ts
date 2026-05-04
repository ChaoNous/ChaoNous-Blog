type RequestContext = {
  request: Request;
};

type MusicAudioErrorCode = "BAD_REQUEST" | "UPSTREAM_ERROR";

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
  code: MusicAudioErrorCode,
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

function createUpstreamUrl(songId: string): URL {
  const upstreamUrl = new URL("https://music.163.com/song/media/outer/url");
  upstreamUrl.searchParams.set("id", `${songId}.mp3`);
  return upstreamUrl;
}

function createProxyHeaders(upstreamResponse: Response): Headers {
  const headers = new Headers();
  const passthroughHeaders = [
    "accept-ranges",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
  ];

  passthroughHeaders.forEach((headerName) => {
    const value = upstreamResponse.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  });

  if (!headers.has("content-type")) {
    headers.set("content-type", "audio/mpeg");
  }

  headers.set(
    "cache-control",
    upstreamResponse.status === 206
      ? "public, max-age=300, s-maxage=300"
      : "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
  );

  return headers;
}

async function handleAudioRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const songId = url.searchParams.get("id")?.trim() ?? "";

  if (!/^\d+$/.test(songId)) {
    return errorResponse(400, "BAD_REQUEST", "Missing or invalid song id.");
  }

  const upstreamHeaders = new Headers({
    accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
    referer: "https://music.163.com/",
    "user-agent":
      request.headers.get("user-agent") ||
      "Mozilla/5.0 (compatible; ChaoNousMusicProxy/1.0)",
  });
  const range = request.headers.get("range");

  if (range) {
    upstreamHeaders.set("range", range);
  }

  try {
    const upstreamResponse = await fetch(createUpstreamUrl(songId), {
      method: request.method,
      headers: upstreamHeaders,
      redirect: "follow",
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return errorResponse(
        502,
        "UPSTREAM_ERROR",
        `Music upstream returned ${upstreamResponse.status}.`,
      );
    }

    return new Response(
      request.method === "HEAD" ? null : upstreamResponse.body,
      {
        status: upstreamResponse.status,
        headers: createProxyHeaders(upstreamResponse),
      },
    );
  } catch (error) {
    console.error("music:audio", error);
    return errorResponse(
      502,
      "UPSTREAM_ERROR",
      "Failed to fetch audio from music upstream.",
    );
  }
}

export const onRequestGet = ({ request }: RequestContext) =>
  handleAudioRequest(request);

export const onRequestHead = ({ request }: RequestContext) =>
  handleAudioRequest(request);
