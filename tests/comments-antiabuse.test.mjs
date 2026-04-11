import assert from "node:assert/strict";
import test from "node:test";
import {
  COMMENT_SUBMISSION_POLICY,
  countUrlsInText,
  evaluateSubmissionContentPolicy,
  evaluateSubmissionRateLimit,
  parseFormLoadedAt,
} from "../functions/_lib/comments-antiabuse.js";

test("countUrlsInText counts both absolute and www links", () => {
  assert.equal(
    countUrlsInText(
      "Visit https://example.com and http://example.org and www.example.net",
    ),
    3,
  );
});

test("parseFormLoadedAt accepts positive timestamps only", () => {
  assert.equal(parseFormLoadedAt("1234"), 1234);
  assert.equal(parseFormLoadedAt("abc"), null);
  assert.equal(parseFormLoadedAt("-1"), null);
});

test("evaluateSubmissionContentPolicy rejects honeypots, fast submits, and link spam", () => {
  const now = 50_000;

  assert.deepEqual(
    evaluateSubmissionContentPolicy({
      website: "bot-filled",
      content: "Hello",
      now,
    }),
    { ok: false, reason: "honeypot" },
  );

  assert.deepEqual(
    evaluateSubmissionContentPolicy({
      content: "Hello",
      formLoadedAt: now - (COMMENT_SUBMISSION_POLICY.minFormFillMs - 1),
      now,
    }),
    { ok: false, reason: "submitted_too_fast" },
  );

  const linkSpam = evaluateSubmissionContentPolicy({
    content:
      "https://a.example https://b.example https://c.example https://d.example",
    now,
  });
  assert.equal(linkSpam.ok, false);
  assert.equal(linkSpam.reason, "too_many_links");
  assert.equal(linkSpam.linksCount, 4);
});

test("evaluateSubmissionRateLimit blocks duplicate and burst submissions", () => {
  const now = 1_000_000;

  assert.deepEqual(
    evaluateSubmissionRateLimit({
      now,
      lastDuplicateCreatedAt:
        now - (COMMENT_SUBMISSION_POLICY.duplicateWindowMs - 1),
    }),
    { ok: false, reason: "duplicate_content" },
  );

  assert.deepEqual(
    evaluateSubmissionRateLimit({
      now,
      lastPostCreatedAt:
        now - (COMMENT_SUBMISSION_POLICY.minSubmitIntervalMs - 1),
    }),
    { ok: false, reason: "rate_limited" },
  );

  assert.deepEqual(
    evaluateSubmissionRateLimit({
      now,
      recentPostCount: COMMENT_SUBMISSION_POLICY.maxRecentPerPost,
    }),
    { ok: false, reason: "rate_limited" },
  );

  assert.deepEqual(
    evaluateSubmissionRateLimit({
      now,
      recentGlobalCount: COMMENT_SUBMISSION_POLICY.maxRecentPerEmail,
    }),
    { ok: false, reason: "rate_limited" },
  );

  assert.deepEqual(
    evaluateSubmissionRateLimit({
      now,
      recentPostCount: 1,
      recentGlobalCount: 2,
      lastPostCreatedAt:
        now - COMMENT_SUBMISSION_POLICY.minSubmitIntervalMs,
    }),
    { ok: true },
  );
});
