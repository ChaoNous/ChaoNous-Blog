import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet as onAdminAnalyticsGet } from "../functions/api/admin/analytics.ts";
import { onRequestGet as onPageStatsGet } from "../functions/api/analytics/pv.ts";
import { onRequestPost as onVisitPost } from "../functions/api/analytics/visit.ts";
import { buildRecentDayKeys } from "../functions/_lib/analytics.ts";

type PageStatsRow = {
  post_slug: string;
  post_url: string;
  post_title: string;
  pageviews: number;
  visits: number;
  updated_at: number;
};

type PageVisitorRow = {
  post_slug: string;
  visitor_id: string;
  first_seen_at: number;
  last_seen_at: number;
};

type PageDailyStatsRow = {
  post_slug: string;
  day: string;
  pageviews: number;
  visits: number;
  updated_at: number;
};

type AdminSessionRow = {
  id: string;
  expires_at: number;
  created_at: number;
};

class MockD1Database {
  pageStats: PageStatsRow[] = [];
  pageVisitors: PageVisitorRow[] = [];
  pageDailyStats: PageDailyStatsRow[] = [];
  adminSessions: AdminSessionRow[] = [];

  prepare(query: string) {
    return new MockD1PreparedStatement(this, query);
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

  async first<T>() {
    const sql = this.query.replace(/\s+/g, " ").trim();
    const values = this.boundValues;

    if (
      sql.includes(
        "SELECT pageviews, visits FROM page_stats WHERE post_slug = ?1",
      )
    ) {
      const [postSlug] = values as [string];
      return (this.database.pageStats.find(
        (entry) => entry.post_slug === postSlug,
      ) || null) as T | null;
    }

    if (
      sql.includes("COALESCE(SUM(pageviews), 0) AS pageviews") &&
      sql.includes("COUNT(*) AS page_count")
    ) {
      return {
        pageviews: this.database.pageStats.reduce(
          (total, entry) => total + entry.pageviews,
          0,
        ),
        visits: this.database.pageStats.reduce(
          (total, entry) => total + entry.visits,
          0,
        ),
        page_count: this.database.pageStats.length,
      } as T;
    }

    if (
      sql.includes("SELECT id FROM admin_sessions") &&
      sql.includes("expires_at > ?2")
    ) {
      const [id, now] = values as [string, number];
      const session = this.database.adminSessions.find(
        (entry) => entry.id === id && entry.expires_at > now,
      );
      return (session ? { id: session.id } : null) as T | null;
    }

    return null;
  }

  async all<T>() {
    const sql = this.query.replace(/\s+/g, " ").trim();
    const values = this.boundValues;

    if (
      sql.includes(
        "SELECT post_slug, post_url, post_title, pageviews, visits, updated_at",
      ) &&
      sql.includes("FROM page_stats") &&
      sql.includes("ORDER BY pageviews DESC, visits DESC, updated_at DESC")
    ) {
      const [limit] = values as [number];
      const results = [...this.database.pageStats]
        .sort(
          (left, right) =>
            right.pageviews - left.pageviews ||
            right.visits - left.visits ||
            right.updated_at - left.updated_at,
        )
        .slice(0, limit);
      return { results: results as T[] };
    }

    if (
      sql.includes(
        "SELECT day, SUM(pageviews) AS total_pv, SUM(visits) AS total_visits",
      ) &&
      sql.includes("FROM page_daily_stats")
    ) {
      const [firstDay] = values as [string];
      const grouped = new Map<
        string,
        { total_pv: number; total_visits: number }
      >();

      for (const row of this.database.pageDailyStats) {
        if (row.day < firstDay) {
          continue;
        }

        const current = grouped.get(row.day) || {
          total_pv: 0,
          total_visits: 0,
        };
        current.total_pv += row.pageviews;
        current.total_visits += row.visits;
        grouped.set(row.day, current);
      }

      return {
        results: [...grouped.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([day, totals]) => ({
            day,
            total_pv: totals.total_pv,
            total_visits: totals.total_visits,
          })) as T[],
      };
    }

    return { results: [] as T[] };
  }

  async run() {
    const sql = this.query.replace(/\s+/g, " ").trim();
    const values = this.boundValues;

    if (sql.startsWith("DELETE FROM admin_sessions WHERE expires_at <= ?1")) {
      const [now] = values as [number];
      const before = this.database.adminSessions.length;
      this.database.adminSessions = this.database.adminSessions.filter(
        (entry) => entry.expires_at > now,
      );
      return {
        meta: {
          changes: before - this.database.adminSessions.length,
        },
      };
    }

    if (sql.startsWith("INSERT OR IGNORE INTO page_visitors")) {
      const [postSlug, visitorId, firstSeenAt, lastSeenAt] = values as [
        string,
        string,
        number,
        number,
      ];
      const existing = this.database.pageVisitors.find(
        (entry) =>
          entry.post_slug === postSlug && entry.visitor_id === visitorId,
      );
      if (existing) {
        return { meta: { changes: 0 } };
      }

      this.database.pageVisitors.push({
        post_slug: postSlug,
        visitor_id: visitorId,
        first_seen_at: firstSeenAt,
        last_seen_at: lastSeenAt,
      });
      return { meta: { changes: 1 } };
    }

    if (sql.startsWith("UPDATE page_visitors SET last_seen_at = ?3")) {
      const [postSlug, visitorId, lastSeenAt] = values as [
        string,
        string,
        number,
      ];
      const existing = this.database.pageVisitors.find(
        (entry) =>
          entry.post_slug === postSlug && entry.visitor_id === visitorId,
      );
      if (existing) {
        existing.last_seen_at = lastSeenAt;
      }
      return { meta: { changes: existing ? 1 : 0 } };
    }

    if (sql.startsWith("INSERT INTO page_stats")) {
      const [postSlug, postUrl, postTitle, visitsToAdd, updatedAt] = values as [
        string,
        string,
        string,
        number,
        number,
      ];
      const existing = this.database.pageStats.find(
        (entry) => entry.post_slug === postSlug,
      );
      if (existing) {
        existing.post_url = postUrl;
        existing.post_title = postTitle;
        existing.pageviews += 1;
        existing.visits += visitsToAdd;
        existing.updated_at = updatedAt;
      } else {
        this.database.pageStats.push({
          post_slug: postSlug,
          post_url: postUrl,
          post_title: postTitle,
          pageviews: 1,
          visits: visitsToAdd,
          updated_at: updatedAt,
        });
      }
      return { meta: { changes: 1 } };
    }

    if (sql.startsWith("INSERT INTO page_daily_stats")) {
      const [postSlug, day, visitsToAdd, updatedAt] = values as [
        string,
        string,
        number,
        number,
      ];
      const existing = this.database.pageDailyStats.find(
        (entry) => entry.post_slug === postSlug && entry.day === day,
      );
      if (existing) {
        existing.pageviews += 1;
        existing.visits += visitsToAdd;
        existing.updated_at = updatedAt;
      } else {
        this.database.pageDailyStats.push({
          post_slug: postSlug,
          day,
          pageviews: 1,
          visits: visitsToAdd,
          updated_at: updatedAt,
        });
      }
      return { meta: { changes: 1 } };
    }

    return { meta: { changes: 0 } };
  }
}

function createEnv(database: MockD1Database) {
  return {
    COMMENTS_DB: database,
    COMMENT_ADMIN_PASSWORD: "secret",
  };
}

function createVisitRequest(
  postUrl: string,
  visitorId: string,
  init?: {
    referer?: string;
    contentType?: string;
    body?: string;
  },
) {
  return new Request("https://chaonous.com/api/analytics/visit", {
    method: "POST",
    headers: {
      origin: "https://chaonous.com",
      referer: init?.referer || postUrl,
      "content-type": init?.contentType || "application/json",
    },
    body:
      init?.body ||
      JSON.stringify({
        postSlug: postUrl,
        postUrl,
        postTitle: "Forecast",
        visitorId,
      }),
  });
}

test("visit analytics counts unique visitors once and keeps total pageviews", async () => {
  const database = new MockD1Database();
  const env = createEnv(database);
  const postUrl = "https://chaonous.com/posts/btc-analysis/";

  const firstResponse = await onVisitPost({
    env,
    request: createVisitRequest(postUrl, "visitor-1"),
  });
  const secondResponse = await onVisitPost({
    env,
    request: createVisitRequest(postUrl, "visitor-1"),
  });
  const thirdResponse = await onVisitPost({
    env,
    request: createVisitRequest(postUrl, "visitor-2"),
  });
  const statsResponse = await onPageStatsGet({
    env,
    request: new Request(
      `https://chaonous.com/api/analytics/pv?postSlug=${encodeURIComponent(postUrl)}`,
    ),
  });

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(thirdResponse.status, 200);
  assert.equal(statsResponse.status, 200);

  const statsPayload = await statsResponse.json();
  assert.equal(statsPayload.pageviews, 3);
  assert.equal(statsPayload.visits, 2);
  assert.equal(database.pageVisitors.length, 2);
  assert.equal(database.pageStats[0]?.pageviews, 3);
  assert.equal(database.pageStats[0]?.visits, 2);
  assert.equal(database.pageDailyStats[0]?.pageviews, 3);
  assert.equal(database.pageDailyStats[0]?.visits, 2);
  assert.ok(
    database.pageVisitors[0]?.last_seen_at >=
      database.pageVisitors[0]?.first_seen_at,
  );
});

test("visit analytics rejects malformed JSON without touching stored rows", async () => {
  const database = new MockD1Database();
  const response = await onVisitPost({
    env: createEnv(database),
    request: createVisitRequest(
      "https://chaonous.com/posts/btc-analysis/",
      "visitor-1",
      {
        body: "{",
      },
    ),
  });

  assert.equal(response.status, 400);
  assert.equal(database.pageStats.length, 0);
  assert.equal(database.pageVisitors.length, 0);
  assert.equal(database.pageDailyStats.length, 0);
});

test("visit analytics rejects mismatched referers", async () => {
  const database = new MockD1Database();
  const response = await onVisitPost({
    env: createEnv(database),
    request: createVisitRequest(
      "https://chaonous.com/posts/btc-analysis/",
      "visitor-1",
      {
        referer: "https://chaonous.com/posts/other-post/",
      },
    ),
  });

  assert.equal(response.status, 400);
  assert.equal(database.pageStats.length, 0);
  assert.equal(database.pageVisitors.length, 0);
});

test("page stats endpoint rejects cross-origin post slugs", async () => {
  const database = new MockD1Database();
  const response = await onPageStatsGet({
    env: createEnv(database),
    request: new Request(
      "https://chaonous.com/api/analytics/pv?postSlug=https%3A%2F%2Fevil.example%2Fpost",
    ),
  });

  assert.equal(response.status, 400);
});

test("admin analytics trend reads from page_daily_stats and zero-fills missing days", async () => {
  const database = new MockD1Database();
  const env = createEnv(database);
  const recentDays = buildRecentDayKeys(14, Date.now());
  const olderDay = recentDays[recentDays.length - 3];
  const latestDay = recentDays[recentDays.length - 1];

  database.pageStats.push(
    {
      post_slug: "https://chaonous.com/posts/btc-analysis/",
      post_url: "https://chaonous.com/posts/btc-analysis/",
      post_title: "BTC",
      pageviews: 120,
      visits: 70,
      updated_at: Date.now(),
    },
    {
      post_slug: "https://chaonous.com/posts/property/",
      post_url: "https://chaonous.com/posts/property/",
      post_title: "Property",
      pageviews: 40,
      visits: 30,
      updated_at: Date.now() - 1_000,
    },
  );
  database.pageDailyStats.push(
    {
      post_slug: "https://chaonous.com/posts/btc-analysis/",
      day: olderDay,
      pageviews: 3,
      visits: 2,
      updated_at: Date.now() - 172_800_000,
    },
    {
      post_slug: "https://chaonous.com/posts/property/",
      day: latestDay,
      pageviews: 5,
      visits: 4,
      updated_at: Date.now(),
    },
  );
  database.adminSessions.push({
    id: "valid-session",
    created_at: Date.now(),
    expires_at: Date.now() + 60_000,
  });

  const response = await onAdminAnalyticsGet({
    env,
    request: new Request("https://chaonous.com/api/admin/analytics?limit=1", {
      headers: {
        cookie: "cnc_admin_session=valid-session",
      },
    }),
  });

  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.deepEqual(payload.summary, {
    pageviews: 160,
    visits: 100,
    pageCount: 2,
  });
  assert.equal(payload.pages.length, 1);
  assert.equal(payload.pages[0]?.postTitle, "BTC");
  assert.equal(payload.recentTrend.length, 14);
  assert.deepEqual(
    payload.recentTrend.find(
      (entry: { day: string }) => entry.day === olderDay,
    ),
    {
      day: olderDay,
      pageviews: 3,
      visits: 2,
    },
  );
  assert.deepEqual(
    payload.recentTrend.find(
      (entry: { day: string }) => entry.day === latestDay,
    ),
    {
      day: latestDay,
      pageviews: 5,
      visits: 4,
    },
  );
  assert.deepEqual(
    payload.recentTrend.find(
      (entry: { day: string }) =>
        entry.day !== olderDay && entry.day !== latestDay,
    ),
    {
      day: recentDays.find((day) => day !== olderDay && day !== latestDay),
      pageviews: 0,
      visits: 0,
    },
  );
});
