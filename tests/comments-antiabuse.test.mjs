import assert from "node:assert/strict";
import test from "node:test";
import {
  COMMENT_SUBMISSION_POLICY,
  countUrlsInText,
  enforceAnonymousSubmissionThrottle,
  enforceAnonymousSubmissionThrottleWithStore,
  evaluateSubmissionContentPolicy,
  evaluateSubmissionRateLimit,
  getRequestFingerprint,
  hashFingerprint,
  parseFormLoadedAt,
  resetAnonymousSubmissionThrottle,
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

test("request fingerprint and anonymous throttle are deterministic", () => {
  resetAnonymousSubmissionThrottle();
  const now = 2_000_000;
  const request = new Request("https://chaonous.com/api/comments", {
    headers: {
      "cf-connecting-ip": "198.51.100.10",
      "user-agent": "CodexTest/1.0",
      "accept-language": "zh-CN",
    },
  });

  assert.equal(
    getRequestFingerprint(request),
    "198.51.100.10|CodexTest/1.0|zh-CN",
  );

  for (let index = 0; index < COMMENT_SUBMISSION_POLICY.maxRecentPerFingerprintPerPost; index += 1) {
    assert.deepEqual(
      enforceAnonymousSubmissionThrottle({
        request,
        postSlug: "https://chaonous.com/posts/test/",
        now,
      }),
      { ok: true },
    );
  }

  assert.deepEqual(
    enforceAnonymousSubmissionThrottle({
      request,
      postSlug: "https://chaonous.com/posts/test/",
      now,
    }),
    {
      ok: false,
      reason: "anonymous_rate_limited",
      retryAfterSeconds: Math.ceil(
        COMMENT_SUBMISSION_POLICY.anonymousRecentPostWindowMs / 1000,
      ),
    },
  );
});

test("store-backed anonymous throttle records and blocks repeated fingerprints", async () => {
  const events = [];
  const env = {
    COMMENTS_DB: {
      prepare(query) {
        const sql = query.replace(/\s+/g, " ").trim();

        return {
          bind(...values) {
            return {
              async first() {
                if (
                  sql.includes("SELECT COUNT(*) AS recent_count") &&
                  sql.includes("FROM comment_submission_events") &&
                  sql.includes("created_at >= ?2")
                ) {
                  const [fingerprintHash, minCreatedAt] = values;
                  return {
                    recent_count: events.filter(
                      (event) =>
                        event.fingerprint_hash === fingerprintHash &&
                        event.created_at >= minCreatedAt,
                    ).length,
                  };
                }

                if (
                  sql.includes("SELECT COUNT(*) AS recent_count") &&
                  sql.includes("FROM comment_submission_events") &&
                  sql.includes("post_slug = ?2")
                ) {
                  const [fingerprintHash, postSlug, minCreatedAt] = values;
                  return {
                    recent_count: events.filter(
                      (event) =>
                        event.fingerprint_hash === fingerprintHash &&
                        event.post_slug === postSlug &&
                        event.created_at >= minCreatedAt,
                    ).length,
                  };
                }

                throw new Error(`Unsupported first() query: ${sql}`);
              },
              async run() {
                if (sql.startsWith("DELETE FROM comment_submission_events")) {
                  const [fingerprintHash, minCreatedAt] = values;
                  for (let index = events.length - 1; index >= 0; index -= 1) {
                    if (
                      events[index].fingerprint_hash === fingerprintHash &&
                      events[index].created_at < minCreatedAt
                    ) {
                      events.splice(index, 1);
                    }
                  }
                  return { meta: { changes: 1 } };
                }

                if (sql.startsWith("INSERT INTO comment_submission_events")) {
                  const [fingerprintHash, postSlug, createdAt] = values;
                  events.push({
                    fingerprint_hash: fingerprintHash,
                    post_slug: postSlug,
                    created_at: createdAt,
                  });
                  return { meta: { changes: 1 } };
                }

                throw new Error(`Unsupported run() query: ${sql}`);
              },
            };
          },
        };
      },
    },
  };
  const request = new Request("https://chaonous.com/api/comments", {
    headers: {
      "cf-connecting-ip": "198.51.100.20",
      "user-agent": "CodexTest/2.0",
      "accept-language": "zh-CN",
    },
  });
  const postSlug = "https://chaonous.com/posts/test/";
  const fingerprintHash = await hashFingerprint(
    "198.51.100.20|CodexTest/2.0|zh-CN",
  );
  const now = 5_000_000;

  for (
    let index = 0;
    index < COMMENT_SUBMISSION_POLICY.maxRecentPerFingerprintPerPost;
    index += 1
  ) {
    const result = await enforceAnonymousSubmissionThrottleWithStore({
      env,
      request,
      postSlug,
      now: now + index,
    });
    assert.deepEqual(result, { ok: true });
  }

  assert.equal(events.length, COMMENT_SUBMISSION_POLICY.maxRecentPerFingerprintPerPost);
  assert.equal(events[0].fingerprint_hash, fingerprintHash);

  const blocked = await enforceAnonymousSubmissionThrottleWithStore({
    env,
    request,
    postSlug,
    now: now + COMMENT_SUBMISSION_POLICY.maxRecentPerFingerprintPerPost,
  });

  assert.deepEqual(blocked, {
    ok: false,
    reason: "anonymous_rate_limited",
    retryAfterSeconds: Math.ceil(
      COMMENT_SUBMISSION_POLICY.anonymousRecentPostWindowMs / 1000,
    ),
  });
});
