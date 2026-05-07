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

function createNeteaseOuterUrl(songId: string): URL {
  const upstreamUrl = new URL("https://music.163.com/song/media/outer/url");
  upstreamUrl.searchParams.set("id", `${songId}.mp3`);
  return upstreamUrl;
}

function createMetingResolverUrl(baseUrl: string, songId: string): URL {
  const resolverUrl = new URL(baseUrl);
  resolverUrl.searchParams.set("server", "netease");
  resolverUrl.searchParams.set("type", "url");
  resolverUrl.searchParams.set("id", songId);
  return resolverUrl;
}

function createResolverUrls(songId: string): URL[] {
  return [
    createNeteaseOuterUrl(songId),
    createMetingResolverUrl("https://api.injahow.cn/meting/", songId),
    createMetingResolverUrl("https://api.amarea.cn/meting/", songId),
    createMetingResolverUrl("https://metingapi.nanorocky.top/", songId),
  ];
}

function normalizeAudioLocation(location: string): string {
  if (location.startsWith("http://")) {
    return `https://${location.slice("http://".length)}`;
  }

  return location;
}

function isUsableAudioLocation(location: string): boolean {
  try {
    const audioUrl = new URL(normalizeAudioLocation(location));
    if (audioUrl.protocol !== "https:") return false;
    if (audioUrl.hostname === "music.163.com" && audioUrl.pathname === "/404") {
      return false;
    }

    return (
      audioUrl.hostname.endsWith("music.126.net") ||
      /\.(mp3|flac|m4a|aac)(?:$|[?#])/i.test(audioUrl.href)
    );
  } catch {
    return false;
  }
}

function createRedirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: normalizeAudioLocation(location),
      "cache-control": "no-store",
    },
  });
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
      : "public, max-age=3600, s-maxage=3600",
  );

  return headers;
}

function isAudioResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") ?? "";
  return (
    contentType.startsWith("audio/") ||
    contentType.includes("application/octet-stream")
  );
}

async function resolveAudioResponse(
  resolverUrl: URL,
  request: Request,
  upstreamHeaders: Headers,
): Promise<Response | null> {
  const upstreamResponse = await fetch(resolverUrl, {
    method: request.method === "HEAD" ? "GET" : request.method,
    headers: upstreamHeaders,
    redirect: "manual",
  });
  const redirectLocation = upstreamResponse.headers.get("location");

  if (redirectLocation && isUsableAudioLocation(redirectLocation)) {
    return createRedirectResponse(redirectLocation);
  }

  if (isAudioResponse(upstreamResponse)) {
    return new Response(
      request.method === "HEAD" ? null : upstreamResponse.body,
      {
        status: upstreamResponse.status,
        headers: createProxyHeaders(upstreamResponse),
      },
    );
  }

  if (upstreamResponse.ok) {
    const responseText = await upstreamResponse.text();
    const trimmedText = responseText.trim();
    if (isUsableAudioLocation(trimmedText)) {
      return createRedirectResponse(trimmedText);
    }
  }

  return null;
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
      "Mozilla/5.0 (compatible; ChaoNousMusicResolver/1.0)",
  });
  const range = request.headers.get("range");

  if (range) {
    upstreamHeaders.set("range", range);
  }

  try {
    for (const resolverUrl of createResolverUrls(songId)) {
      const resolvedResponse = await resolveAudioResponse(
        resolverUrl,
        request,
        upstreamHeaders,
      );

      if (resolvedResponse) {
        return resolvedResponse;
      }
    }

    return errorResponse(
      502,
      "UPSTREAM_ERROR",
      "No music resolver returned a playable audio URL.",
    );
  } catch (error) {
    console.error("music:audio", error);
    return errorResponse(
      502,
      "UPSTREAM_ERROR",
      "Failed to resolve audio from music upstream.",
    );
  }
}

export const onRequestGet = ({ request }: RequestContext) =>
  handleAudioRequest(request);

export const onRequestHead = ({ request }: RequestContext) =>
  handleAudioRequest(request);