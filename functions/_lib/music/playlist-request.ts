import { getTrimmedSearchParam, isPositiveIntegerString } from "../request.ts";
import type { MusicPlaylistRequest, MusicRequestError } from "./types.ts";

const SUPPORTED_SERVER = "netease" as const;
const SUPPORTED_TYPE = "playlist" as const;

export type MusicPlaylistRequestResult =
  | {
      ok: true;
      value: MusicPlaylistRequest;
    }
  | {
      ok: false;
      error: MusicRequestError;
    };

export function parseMusicPlaylistRequest(
  request: Request,
): MusicPlaylistRequestResult {
  const url = new URL(request.url);
  const server = getTrimmedSearchParam(url, "server");
  const type = getTrimmedSearchParam(url, "type");
  const playlistId = getTrimmedSearchParam(url, "id");

  if (!playlistId) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "BAD_REQUEST",
        message: "Missing playlist id.",
      },
    };
  }

  if (!isPositiveIntegerString(playlistId)) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "BAD_REQUEST",
        message: "Playlist id must be a positive integer.",
      },
    };
  }

  if (server !== SUPPORTED_SERVER || type !== SUPPORTED_TYPE) {
    return {
      ok: false,
      error: {
        status: 400,
        code: "UNSUPPORTED_SOURCE",
        message: "Only netease playlist requests are supported.",
      },
    };
  }

  return {
    ok: true,
    value: {
      server: SUPPORTED_SERVER,
      type: SUPPORTED_TYPE,
      playlistId,
    },
  };
}
