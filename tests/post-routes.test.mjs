import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllPostSlugs,
  getCanonicalPostSlug,
} from "../src/utils/post-routes.js";

test("getCanonicalPostSlug prefers permalink over alias and default slug", () => {
  const post = {
    id: "notes/hello-world.md",
    data: {
      alias: "/posts/legacy/hello-world/",
      permalink: "/featured/hello-world/",
    },
  };

  assert.equal(getCanonicalPostSlug(post), "featured/hello-world");
});

test("getAllPostSlugs normalizes post-scoped aliases and deduplicates routes", () => {
  const post = {
    id: "notes/hello-world.md",
    data: {
      alias: "/posts/legacy/hello-world/",
      permalink: "/posts/notes/hello-world/",
    },
  };

  assert.deepEqual(getAllPostSlugs(post), [
    "notes/hello-world",
    "legacy/hello-world",
  ]);
});

test("getAllPostSlugs falls back to the default slug when no overrides exist", () => {
  const post = {
    id: "guide/getting-started.mdx",
    data: {},
  };

  assert.deepEqual(getAllPostSlugs(post), ["guide/getting-started"]);
});
