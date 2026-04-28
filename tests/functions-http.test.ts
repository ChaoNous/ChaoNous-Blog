import assert from "node:assert/strict";
import test from "node:test";
import { json, jsonError } from "../functions/_lib/http.ts";

test("json returns UTF-8 JSON with merged headers", async () => {
  const response = json(
    { ok: true },
    {
      status: 201,
      headers: {
        "cache-control": "public, max-age=60",
      },
    },
  );

  assert.equal(response.status, 201);
  assert.equal(
    response.headers.get("content-type"),
    "application/json; charset=utf-8",
  );
  assert.equal(response.headers.get("cache-control"), "public, max-age=60");
  assert.deepEqual(await response.json(), { ok: true });
});

test("jsonError applies default no-store cache headers", async () => {
  const response = jsonError({
    status: 400,
    code: "BAD_REQUEST",
    message: "Broken request.",
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    ok: false,
    code: "BAD_REQUEST",
    message: "Broken request.",
  });
});
