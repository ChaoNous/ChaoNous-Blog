import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet } from "../functions/api/music/playlist.ts";

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
});

test("music playlist api maps a netease playlist into player tracks", async () => {
  const requestedUrls: string[] = [];
  const requestHeaders: Headers[] = [];

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const requestedUrl =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;
    requestedUrls.push(requestedUrl);
    requestHeaders.push(new Headers(init?.headers));

    if (requestedUrl.includes("/api/song/enhance/player/url")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: 1417453801,
              url: "http://m10.music.126.net/test-song.mp3",
              code: 200,
            },
            {
              id: 33789445,
              url: null,
              code: 404,
            },
            {
              id: 3319151600,
              url: null,
              code: 404,
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        result: {
          tracks: [
            {
              id: 1417453801,
              name: "Test Song",
              artists: [{ name: "Test Artist" }],
              album: {
                picUrl: "http://p1.music.126.net/example.jpg",
              },
              duration: 82383,
            },
            {
              id: 33789445,
              name: "Unavailable Song",
              artists: [{ name: "Hidden Artist" }],
              duration: 154128,
            },
            {
              id: 3319151600,
              name: "Flower Gardens",
              artists: [{ name: "Magnus Ringblom" }],
              duration: 178200,
            },
            {
              id: 0,
              name: "Broken Song",
            },
          ],
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=13556055400",
    ),
  });

  assert.equal(response.status, 200);
  assert.match(
    requestedUrls[0],
    /^https:\/\/music\.163\.com\/api\/playlist\/detail\?id=13556055400$/,
  );
  assert.match(
    requestedUrls[1],
    /^https:\/\/music\.163\.com\/api\/song\/enhance\/player\/url\?ids=/,
  );
  assert.equal(requestedUrls.length, 2);
  assert.equal(requestHeaders[0]?.get("referer"), "https://music.163.com/");
  assert.equal(requestHeaders[1]?.get("referer"), "https://music.163.com/");
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=300/);

  const payload = await response.json();
  assert.deepEqual(payload, [
    {
      id: 1417453801,
      name: "Test Song",
      artist: "Test Artist",
      author: "Test Artist",
      pic: "https://p1.music.126.net/example.jpg",
      url: "https://m10.music.126.net/test-song.mp3",
      duration: 82383,
    },
    {
      id: 33789445,
      name: "Unavailable Song",
      artist: "Hidden Artist",
      author: "Hidden Artist",
      pic: "",
      url: "https://music.163.com/song/media/outer/url?id=33789445.mp3",
      duration: 154128,
    },
    {
      id: 3319151600,
      name: "Flower Gardens",
      artist: "Magnus Ringblom",
      author: "Magnus Ringblom",
      pic: "",
      url: "https://music.163.com/song/media/outer/url?id=3319151600.mp3",
      duration: 178200,
    },
  ]);
});

test("music playlist api keeps songs when playable url lookup fails", async () => {
  console.error = () => {};

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const requestedUrl =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;

    if (requestedUrl.includes("/api/song/enhance/player/url")) {
      assert.equal(
        new Headers(init?.headers).get("referer"),
        "https://music.163.com/",
      );

      return new Response("upstream error", {
        status: 503,
      });
    }

    return new Response(
      JSON.stringify({
        result: {
          tracks: [
            {
              id: 33789445,
              name: "Unavailable Song",
              artists: [{ name: "Hidden Artist" }],
              duration: 154128,
            },
          ],
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=13556055400",
    ),
  });

  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.deepEqual(payload, [
    {
      id: 33789445,
      name: "Unavailable Song",
      artist: "Hidden Artist",
      author: "Hidden Artist",
      pic: "",
      url: "https://music.163.com/song/media/outer/url?id=33789445.mp3",
      duration: 154128,
    },
  ]);
});

test("music playlist api uses static metadata when the configured playlist is empty upstream", async () => {
  globalThis.fetch = async (input: string | URL | Request) => {
    const requestedUrl =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;

    if (requestedUrl.includes("/api/song/enhance/player/url")) {
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ result: { tracks: [] } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=13556055400",
    ),
  });

  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.equal(payload.length, 8);
  assert.deepEqual(payload[0], {
    id: 1417453801,
    name: "\u5929\u6daf",
    artist: "\u5f6d\u7b54\uff08\u7b54\u7b54\uff09",
    author: "\u5f6d\u7b54\uff08\u7b54\u7b54\uff09",
    pic: "https://p2.music.126.net/dJYDn4g8Bg-QaNNjT_GV4g==/109951164635341476.jpg",
    url: "https://music.163.com/song/media/outer/url?id=1417453801.mp3",
    duration: 82383,
  });
});

test("music playlist api rejects unsupported sources", async () => {
  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=tencent&type=playlist&id=123",
    ),
  });

  assert.equal(response.status, 400);

  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "UNSUPPORTED_SOURCE");
});

test("music playlist api rejects missing playlist ids", async () => {
  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist",
    ),
  });

  assert.equal(response.status, 400);

  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "BAD_REQUEST");
  assert.equal(payload.message, "Missing playlist id.");
});

test("music playlist api rejects non-numeric playlist ids", async () => {
  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=playlist-demo",
    ),
  });

  assert.equal(response.status, 400);

  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "BAD_REQUEST");
  assert.equal(payload.message, "Playlist id must be a positive integer.");
});

test("music playlist api surfaces upstream failures", async () => {
  globalThis.fetch = async () =>
    new Response("upstream error", {
      status: 503,
    });

  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=123",
    ),
  });

  assert.equal(response.status, 502);

  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "UPSTREAM_ERROR");
});

test("music playlist api falls back to a generic upstream error on fetch rejection", async () => {
  console.error = () => {};
  globalThis.fetch = async () => {
    throw new Error("socket hang up");
  };

  const response = await onRequestGet({
    request: new Request(
      "https://chaonous.com/api/music/playlist?server=netease&type=playlist&id=123",
    ),
  });

  assert.equal(response.status, 502);

  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.code, "UPSTREAM_ERROR");
  assert.equal(
    payload.message,
    "Failed to fetch playlist from music upstream.",
  );
});
