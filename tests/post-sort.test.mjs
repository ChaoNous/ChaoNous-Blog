import assert from "node:assert/strict";
import test from "node:test";
import {
  assignAdjacentPosts,
  comparePostOrder,
  sortPosts,
} from "../src/utils/post-sort.js";

function createPost({
  id,
  title = id,
  published,
  pinned = false,
  priority,
}) {
  return {
    id,
    data: {
      title,
      published: new Date(published),
      pinned,
      priority,
      prevSlug: "",
      prevTitle: "",
      nextSlug: "",
      nextTitle: "",
    },
  };
}

test("comparePostOrder keeps identical publish dates stable", () => {
  const left = createPost({
    id: "left",
    published: "2026-04-01T00:00:00Z",
  });
  const right = createPost({
    id: "right",
    published: "2026-04-01T00:00:00Z",
  });

  assert.equal(comparePostOrder(left, right), 0);
});

test("sortPosts prioritizes pinned posts and lower priority values", () => {
  const posts = [
    createPost({
      id: "regular-newer",
      published: "2026-04-03T00:00:00Z",
    }),
    createPost({
      id: "pinned-priority-2",
      published: "2026-03-01T00:00:00Z",
      pinned: true,
      priority: 2,
    }),
    createPost({
      id: "pinned-priority-1",
      published: "2026-02-01T00:00:00Z",
      pinned: true,
      priority: 1,
    }),
  ];

  const sorted = sortPosts(posts);
  assert.deepEqual(
    sorted.map((post) => post.id),
    ["pinned-priority-1", "pinned-priority-2", "regular-newer"],
  );
});

test("assignAdjacentPosts links previous and next post metadata", () => {
  const sorted = sortPosts([
    createPost({
      id: "older",
      title: "Older",
      published: "2026-03-01T00:00:00Z",
    }),
    createPost({
      id: "newer",
      title: "Newer",
      published: "2026-04-01T00:00:00Z",
    }),
    createPost({
      id: "oldest",
      title: "Oldest",
      published: "2026-02-01T00:00:00Z",
    }),
  ]);

  assignAdjacentPosts(sorted);

  assert.equal(sorted[0].id, "newer");
  assert.equal(sorted[0].data.prevSlug, "older");
  assert.equal(sorted[0].data.prevTitle, "Older");
  assert.equal(sorted[1].data.nextSlug, "newer");
  assert.equal(sorted[1].data.prevSlug, "oldest");
  assert.equal(sorted[2].data.nextTitle, "Older");
});
