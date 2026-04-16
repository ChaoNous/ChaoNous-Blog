import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet } from "../functions/api/music/playlist.ts";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("music playlist api maps a netease playlist into player tracks", async () => {
  let requestedUrl = "";
  let requestHeaders: Headers | undefined;

  globalThis.fetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    requestedUrl =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;
    requestHeaders = new Headers(init?.headers);

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
    requestedUrl,
    /^https:\/\/music\.163\.com\/api\/playlist\/detail\?id=13556055400$/,
  );
  assert.equal(requestHeaders?.get("referer"), "https://music.163.com/");
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=3600/);

  const payload = await response.json();
  assert.deepEqual(payload, [
    {
      id: 1417453801,
      name: "Test Song",
      artist: "Test Artist",
      author: "Test Artist",
      pic: "https://p1.music.126.net/example.jpg",
      url: "https://music.163.com/song/media/outer/url?id=1417453801.mp3",
      duration: 82383,
    },
  ]);
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
