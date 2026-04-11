import assert from "node:assert/strict";
import test from "node:test";
import { onRequestDelete } from "../functions/api/comments/[id].ts";
import { onRequestPost } from "../functions/api/comments/index.ts";
import { resetAnonymousSubmissionThrottle } from "../functions/_lib/comments-antiabuse.js";

type CommentRow = {
  id: number;
  parent_id: number | null;
  post_slug: string;
  post_url: string;
  post_title: string;
  author_name: string;
  author_email: string;
  author_url: string | null;
  content: string;
  delete_token: string | null;
  created_at: number;
  updated_at: number;
};

class MockD1Database {
  comments: CommentRow[] = [];
  nextId = 1;

  prepare(query: string) {
    return new MockD1PreparedStatement(this, query);
  }

  buildSubtree(ids: number[]) {
    const visited = new Set<number>();
    const stack = [...ids];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);

      for (const comment of this.comments) {
        if (comment.parent_id === currentId) {
          stack.push(comment.id);
        }
      }
    }

    return visited;
  }
}

class MockD1PreparedStatement {
  private boundValues: unknown[] = [];

  constructor(
    private readonly database: MockD1Database,
    private readonly query: string,
  ) {}

  bind(...values: unknown[]) {
    this.boundValues = values;
    return this;
  }

  async all<T>() {
    return { results: [] as T[] };
  }

  async first<T>() {
    const sql = this.query.replace(/\s+/g, " ").trim();
    const values = this.boundValues;

    if (
      sql.includes(
        "SELECT COUNT(*) AS recent_count, MAX(created_at) AS last_created_at FROM comments",
      )
    ) {
      const [postSlug, email, minCreatedAt] = values as [string, string, number];
      const matches = this.database.comments.filter(
        (comment) =>
          comment.post_slug === postSlug &&
          comment.author_email === email &&
          comment.created_at >= minCreatedAt,
      );
      return {
        recent_count: matches.length,
        last_created_at:
          matches.length > 0
            ? Math.max(...matches.map((comment) => comment.created_at))
            : null,
      } as T;
    }

    if (
      sql.includes(
        "SELECT COUNT(*) AS recent_count FROM comments WHERE author_email = ?1",
      )
    ) {
      const [email, minCreatedAt] = values as [string, number];
      const recentCount = this.database.comments.filter(
        (comment) =>
          comment.author_email === email && comment.created_at >= minCreatedAt,
      ).length;
      return { recent_count: recentCount } as T;
    }

    if (
      sql.includes(
        "SELECT MAX(created_at) AS last_created_at FROM comments WHERE post_slug = ?1",
      )
    ) {
      const [postSlug, email, content, minCreatedAt] = values as [
        string,
        string,
        string,
        number,
      ];
      const matches = this.database.comments.filter(
        (comment) =>
          comment.post_slug === postSlug &&
          comment.author_email === email &&
          comment.content === content &&
          comment.created_at >= minCreatedAt,
      );
      return {
        last_created_at:
          matches.length > 0
            ? Math.max(...matches.map((comment) => comment.created_at))
            : null,
      } as T;
    }

    if (sql.includes("SELECT id, post_slug FROM comments WHERE id = ?1")) {
      const [id] = values as [number];
      const comment = this.database.comments.find((entry) => entry.id === id);
      return (comment
        ? { id: comment.id, post_slug: comment.post_slug }
        : null) as T | null;
    }

    if (sql.includes("SELECT id, delete_token FROM comments WHERE id = ?1")) {
      const [id] = values as [number];
      const comment = this.database.comments.find((entry) => entry.id === id);
      return (comment
        ? { id: comment.id, delete_token: comment.delete_token }
        : null) as T | null;
    }

    if (
      sql.includes("WITH RECURSIVE subtree") &&
      sql.includes("SELECT COUNT(DISTINCT id) AS total_count")
    ) {
      const ids = values as number[];
      return { total_count: this.database.buildSubtree(ids).size } as T;
    }

    throw new Error(`Unsupported first() query: ${sql}`);
  }

  async run() {
    const sql = this.query.replace(/\s+/g, " ").trim();
    const values = this.boundValues;

    if (sql.startsWith("INSERT INTO comments (")) {
      const [
        postSlug,
        postUrl,
        postTitle,
        parentId,
        authorName,
        authorEmail,
        authorUrl,
        content,
        deleteToken,
        createdAt,
        updatedAt,
      ] = values as [
        string,
        string,
        string,
        number | null,
        string,
        string,
        string | null,
        string,
        string,
        number,
        number,
      ];

      const id = this.database.nextId++;
      this.database.comments.push({
        id,
        parent_id: parentId,
        post_slug: postSlug,
        post_url: postUrl,
        post_title: postTitle,
        author_name: authorName,
        author_email: authorEmail,
        author_url: authorUrl,
        content,
        delete_token: deleteToken,
        created_at: createdAt,
        updated_at: updatedAt,
      });

      return { meta: { last_row_id: id, changes: 1 } };
    }

    if (
      sql.includes("WITH RECURSIVE subtree") &&
      sql.includes("DELETE FROM comments")
    ) {
      const ids = values as number[];
      const subtree = this.database.buildSubtree(ids);
      const before = this.database.comments.length;
      this.database.comments = this.database.comments.filter(
        (comment) => !subtree.has(comment.id),
      );
      return {
        meta: {
          changes: before - this.database.comments.length,
        },
      };
    }

    throw new Error(`Unsupported run() query: ${sql}`);
  }
}

function createEnv(seedComments: CommentRow[] = []) {
  const database = new MockD1Database();
  database.comments = seedComments.map((comment) => ({ ...comment }));
  database.nextId =
    database.comments.reduce((maxId, comment) => Math.max(maxId, comment.id), 0) +
    1;

  return {
    COMMENTS_DB: database,
  };
}

function createCommentRequest(body: Record<string, unknown>, init?: {
  headers?: Record<string, string>;
}) {
  return new Request("https://chaonous.com/api/comments", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://chaonous.com",
      "cf-connecting-ip": "203.0.113.10",
      "user-agent": "CodexTest/1.0",
      "accept-language": "zh-CN,zh;q=0.9",
      ...(init?.headers || {}),
    },
    body: JSON.stringify(body),
  });
}

function createValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    postSlug: "https://chaonous.com/posts/test/",
    postUrl: "https://chaonous.com/posts/test/",
    postTitle: "Test Post",
    name: "Alice",
    email: "alice@example.com",
    url: "",
    content: "Hello from the integration test.",
    website: "",
    formLoadedAt: String(Date.now() - 5_000),
    parentId: "",
    ...overrides,
  };
}

test("comments API creates a comment successfully", async (t) => {
  resetAnonymousSubmissionThrottle();
  t.mock.method(Date, "now", () => 1_000_000);

  const env = createEnv();
  const response = await onRequestPost({
    env,
    request: createCommentRequest(createValidPayload()),
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(env.COMMENTS_DB.comments.length, 1);
  assert.equal(env.COMMENTS_DB.comments[0].author_email, "alice@example.com");
});

test("comments API returns 429 for submissions that are too fast", async (t) => {
  resetAnonymousSubmissionThrottle();
  t.mock.method(Date, "now", () => 1_000_000);

  const env = createEnv();
  const response = await onRequestPost({
    env,
    request: createCommentRequest(
      createValidPayload({ formLoadedAt: String(1_000_000 - 500) }),
    ),
  });

  assert.equal(response.status, 429);
  const payload = await response.json();
  assert.equal(payload.code, "TOO_MANY_REQUESTS");
});

test("comments API blocks duplicate comments within the duplicate window", async (t) => {
  resetAnonymousSubmissionThrottle();
  t.mock.method(Date, "now", () => 2_000_000);

  const env = createEnv([
    {
      id: 1,
      parent_id: null,
      post_slug: "https://chaonous.com/posts/test/",
      post_url: "https://chaonous.com/posts/test/",
      post_title: "Test Post",
      author_name: "Alice",
      author_email: "alice@example.com",
      author_url: null,
      content: "Hello from the integration test.",
      delete_token: "token-1",
      created_at: 2_000_000 - 60_000,
      updated_at: 2_000_000 - 60_000,
    },
  ]);

  const response = await onRequestPost({
    env,
    request: createCommentRequest(createValidPayload()),
  });

  assert.equal(response.status, 429);
  const payload = await response.json();
  assert.equal(payload.code, "TOO_MANY_REQUESTS");
});

test("comments API applies anonymous fingerprint throttling across different emails", async (t) => {
  resetAnonymousSubmissionThrottle();
  t.mock.method(Date, "now", () => 3_000_000);

  const env = createEnv();

  for (let index = 0; index < 4; index += 1) {
    const response = await onRequestPost({
      env,
      request: createCommentRequest(
        createValidPayload({
          email: `user${index}@example.com`,
          name: `User ${index}`,
          content: `Comment ${index}`,
        }),
      ),
    });
    assert.equal(response.status, 201);
  }

  const blockedResponse = await onRequestPost({
    env,
    request: createCommentRequest(
      createValidPayload({
        email: "fifth@example.com",
        name: "Fifth User",
        content: "Comment 5",
      }),
    ),
  });

  assert.equal(blockedResponse.status, 429);
  const payload = await blockedResponse.json();
  assert.equal(payload.code, "TOO_MANY_REQUESTS");
});

test("comments delete API removes a comment subtree when the token is valid", async () => {
  resetAnonymousSubmissionThrottle();

  const env = createEnv([
    {
      id: 1,
      parent_id: null,
      post_slug: "https://chaonous.com/posts/test/",
      post_url: "https://chaonous.com/posts/test/",
      post_title: "Test Post",
      author_name: "Alice",
      author_email: "alice@example.com",
      author_url: null,
      content: "Root",
      delete_token: "token-root",
      created_at: 1,
      updated_at: 1,
    },
    {
      id: 2,
      parent_id: 1,
      post_slug: "https://chaonous.com/posts/test/",
      post_url: "https://chaonous.com/posts/test/",
      post_title: "Test Post",
      author_name: "Bob",
      author_email: "bob@example.com",
      author_url: null,
      content: "Reply",
      delete_token: "token-reply",
      created_at: 2,
      updated_at: 2,
    },
  ]);

  const response = await onRequestDelete({
    env,
    params: { id: "1" },
    request: new Request(
      "https://chaonous.com/api/comments/1?token=token-root",
      {
        method: "DELETE",
        headers: {
          origin: "https://chaonous.com",
        },
      },
    ),
  });

  assert.equal(response.status, 200);
  assert.equal(env.COMMENTS_DB.comments.length, 0);
});

test("comments delete API rejects invalid delete tokens", async () => {
  resetAnonymousSubmissionThrottle();

  const env = createEnv([
    {
      id: 1,
      parent_id: null,
      post_slug: "https://chaonous.com/posts/test/",
      post_url: "https://chaonous.com/posts/test/",
      post_title: "Test Post",
      author_name: "Alice",
      author_email: "alice@example.com",
      author_url: null,
      content: "Root",
      delete_token: "token-root",
      created_at: 1,
      updated_at: 1,
    },
  ]);

  const response = await onRequestDelete({
    env,
    params: { id: "1" },
    request: new Request(
      "https://chaonous.com/api/comments/1?token=wrong-token",
      {
        method: "DELETE",
        headers: {
          origin: "https://chaonous.com",
        },
      },
    ),
  });

  assert.equal(response.status, 401);
  assert.equal(env.COMMENTS_DB.comments.length, 1);
});
