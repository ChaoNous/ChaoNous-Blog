import assert from "node:assert/strict";
import test from "node:test";
import { parseMusicPlaylistRequest } from "../functions/_lib/music/playlist-request.ts";

test("parseMusicPlaylistRequest trims and accepts supported sources", () => {
  const result = parseMusicPlaylistRequest(
    new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=%2013556055400%20",
    ),
  );

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(result.value, {
      server: "netease",
      type: "playlist",
      playlistId: "13556055400",
    });
  }
});

test("parseMusicPlaylistRequest rejects invalid playlist ids", () => {
  const result = parseMusicPlaylistRequest(
    new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=abc123",
    ),
  );

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.deepEqual(result.error, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Playlist id must be a positive integer.",
    });
  }
});
