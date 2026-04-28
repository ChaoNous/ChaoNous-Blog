import { json, jsonError } from "../../_lib/http.ts";
import {
  fetchNeteasePlaylistTracks,
  MusicUpstreamResponseError,
} from "../../_lib/music/netease.ts";
import { parseMusicPlaylistRequest } from "../../_lib/music/playlist-request.ts";

type RequestContext = {
  request: Request;
};

export const onRequestGet = async ({ request }: RequestContext) => {
  const parsedRequest = parseMusicPlaylistRequest(request);

  if (!parsedRequest.ok) {
    return jsonError(parsedRequest.error);
  }

  const { playlistId } = parsedRequest.value;

  try {
    const songs = await fetchNeteasePlaylistTracks(playlistId);

    return json(songs, {
      status: 200,
      headers: {
        "cache-control":
          "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    if (error instanceof MusicUpstreamResponseError) {
      return jsonError({
        status: 502,
        code: "UPSTREAM_ERROR",
        message: `Music upstream returned ${error.upstreamStatus}.`,
      });
    }

    console.error("music.playlist", {
      playlistId,
      error: error instanceof Error ? error.message : String(error),
    });

    return jsonError({
      status: 502,
      code: "UPSTREAM_ERROR",
      message: "Failed to fetch playlist from music upstream.",
    });
  }
};
