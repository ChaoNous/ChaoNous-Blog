import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet as onAdminAnalyticsGet } from "../functions/api/admin/analytics.ts";
import { buildRecentDayKeys } from "../functions/_lib/analytics.ts";

type PageStatsRow = {
  post_slug: string;
  post_url: string;
  post_title: string;
  pageviews: number;
  visits: number;
  updated_at: number;
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
  pageDailyStats: PageDailyStatsRow[] = [];
  adminSessions: AdminSessionRow[] = [];
  missingPageDailyStatsTable = false;

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
      const [id, now] = this.boundValues as [string, number];
      const session = this.database.adminSessions.find(
        (entry) => entry.id === id && entry.expires_at > now,
      );
      return (session ? { id: session.id } : null) as T | null;
    }

    return null;
  }

  async all<T>() {
    const sql = this.query.replace(/\s+/g, " ").trim();

    if (
      sql.includes(
        "SELECT post_slug, post_url, post_title, pageviews, visits, updated_at",
      ) &&
      sql.includes("FROM page_stats") &&
      sql.includes("ORDER BY pageviews DESC, visits DESC, updated_at DESC")
    ) {
      const [limit] = this.boundValues as [number];
      return {
        results: [...this.database.pageStats]
          .sort(
            (left, right) =>
              right.pageviews - left.pageviews ||
              right.visits - left.visits ||
              right.updated_at - left.updated_at,
          )
          .slice(0, limit) as T[],
      };
    }

    if (
      sql.includes(
        "SELECT day, SUM(pageviews) AS total_pv, SUM(visits) AS total_visits",
      ) &&
      sql.includes("FROM page_daily_stats")
    ) {
      if (this.database.missingPageDailyStatsTable) {
        throw new Error("no such table: page_daily_stats");
      }

      const [firstDay] = this.boundValues as [string];
      const grouped = new Map<string, { total_pv: number; total_visits: number }>();

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

    if (sql.startsWith("DELETE FROM admin_sessions WHERE expires_at <= ?1")) {
      const [now] = this.boundValues as [number];
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

    return { meta: { changes: 0 } };
  }
}

function createEnv(database: MockD1Database) {
  return {
    COMMENTS_DB: database,
    COMMENT_ADMIN_PASSWORD: "secret",
  };
}

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
    payload.recentTrend.find((entry: { day: string }) => entry.day === olderDay),
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

test("admin analytics still returns zero-filled trend when page_daily_stats is unavailable", async () => {
  const database = new MockD1Database();
  database.missingPageDailyStatsTable = true;
  const env = createEnv(database);

  database.pageStats.push({
    post_slug: "https://chaonous.com/posts/btc-analysis/",
    post_url: "https://chaonous.com/posts/btc-analysis/",
    post_title: "BTC",
    pageviews: 12,
    visits: 7,
    updated_at: Date.now(),
  });
  database.adminSessions.push({
    id: "valid-session",
    created_at: Date.now(),
    expires_at: Date.now() + 60_000,
  });

  const response = await onAdminAnalyticsGet({
    env,
    request: new Request("https://chaonous.com/api/admin/analytics", {
      headers: {
        cookie: "cnc_admin_session=valid-session",
      },
    }),
  });

  assert.equal(response.status, 200);

  const payload = await response.json();
  assert.deepEqual(payload.summary, {
    pageviews: 12,
    visits: 7,
    pageCount: 1,
  });
  assert.equal(payload.recentTrend.length, 14);
  assert.ok(
    payload.recentTrend.every(
      (entry: { pageviews: number; visits: number }) =>
        entry.pageviews === 0 && entry.visits === 0,
    ),
  );
});
