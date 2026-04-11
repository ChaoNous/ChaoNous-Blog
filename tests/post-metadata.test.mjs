import assert from "node:assert/strict";
import test from "node:test";
import {
  parseFrontmatter,
  parseFrontmatterScalar,
  validateLoadedPostMetadata,
} from "../scripts/lib/post-metadata.mjs";

test("parseFrontmatterScalar extracts quoted and plain scalar values", () => {
  const frontmatter = parseFrontmatter(`---
title: "Hello"
alias: /posts/hello/
image: "./cover.webp"
---

Body
`);

  assert.equal(parseFrontmatterScalar(frontmatter, "title"), "Hello");
  assert.equal(parseFrontmatterScalar(frontmatter, "alias"), "/posts/hello/");
  assert.equal(parseFrontmatterScalar(frontmatter, "image"), "./cover.webp");
  assert.equal(parseFrontmatterScalar(frontmatter, "permalink"), "");
});

test("validateLoadedPostMetadata reports duplicate routes and missing local images", () => {
  const result = validateLoadedPostMetadata([
    {
      relativePath: "alpha.md",
      alias: "",
      permalink: "",
      image: "./cover.webp",
      localImagePath: "C:/repo/src/content/posts/cover.webp",
      localImageExists: false,
      routeSlugs: ["alpha"],
    },
    {
      relativePath: "beta.md",
      alias: "/posts/alpha/",
      permalink: "",
      image: "",
      localImagePath: null,
      localImageExists: true,
      routeSlugs: ["beta", "alpha"],
    },
  ]);

  assert.equal(result.routeCount, 2);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /does not exist/);
  assert.match(result.errors[1], /conflicts with alpha\.md/);
});
