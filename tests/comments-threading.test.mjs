import assert from "node:assert/strict";
import test from "node:test";
import { paginateNestedComments } from "../functions/_lib/comments-threading.js";

function createComment(id, parentId, createdAt) {
  const iso = new Date(createdAt).toISOString();

  return {
    id,
    parentId,
    postSlug: "https://chaonous.com/posts/test/",
    postUrl: "https://chaonous.com/posts/test/",
    postTitle: "Test",
    authorName: `Author ${id}`,
    authorUrl: null,
    content: `Comment ${id}`,
    createdAt: iso,
    updatedAt: iso,
  };
}

test("paginateNestedComments keeps replies with their root thread", () => {
  const records = [
    createComment(1, null, "2026-04-01T08:00:00Z"),
    createComment(2, 1, "2026-04-01T08:10:00Z"),
    createComment(3, null, "2026-04-01T09:00:00Z"),
    createComment(4, 3, "2026-04-01T09:10:00Z"),
  ];

  const firstPage = paginateNestedComments(records, 1, 1);
  assert.equal(firstPage.totalCount, 2);
  assert.equal(firstPage.data.length, 1);
  assert.equal(firstPage.data[0].id, 1);
  assert.deepEqual(
    firstPage.data[0].replies.map((reply) => reply.id),
    [2],
  );

  const secondPage = paginateNestedComments(records, 2, 1);
  assert.equal(secondPage.data.length, 1);
  assert.equal(secondPage.data[0].id, 3);
  assert.deepEqual(
    secondPage.data[0].replies.map((reply) => reply.id),
    [4],
  );
});

test("paginateNestedComments treats orphan replies as root threads", () => {
  const records = [
    createComment(11, 99, "2026-04-01T08:00:00Z"),
    createComment(12, null, "2026-04-01T09:00:00Z"),
  ];

  const paginated = paginateNestedComments(records, 1, 10);
  assert.equal(paginated.totalCount, 2);
  assert.deepEqual(
    paginated.data.map((comment) => comment.id),
    [11, 12],
  );
});
