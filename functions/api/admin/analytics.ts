import {
  buildRecentDayKeys,
  COMMENT_MESSAGES,
  isMissingPageDailyStatsTableError,
  json,
  requireAdminSession,
  serverError,
  type Env,
} from "../../_lib/comments";

interface AnalyticsRow {
  post_slug: string;
  post_url: string;
  post_title: string;
  pageviews: number;
  visits: number;
  updated_at: number;
}

interface DailyRow {
  day: string;
  total_pv: number;
  total_visits: number;
}

export const onRequestGet = async ({
  env,
  request,
}: {
  env: Env;
  request: Request;
}) => {
  const authResponse = await requireAdminSession(
    request,
    env,
    COMMENT_MESSAGES.adminUnauthorized,
  );
  if (authResponse) {
    return authResponse;
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20,
      ),
    );
    const recentDays = buildRecentDayKeys(14);
    const firstDay = recentDays[0];

    const [summary, pages] = await Promise.all([
      env.COMMENTS_DB.prepare(
        `SELECT
					COALESCE(SUM(pageviews), 0) AS pageviews,
					COALESCE(SUM(visits), 0) AS visits,
					COUNT(*) AS page_count
				 FROM page_stats`,
      ).first<{ pageviews: number; visits: number; page_count: number }>(),
      env.COMMENTS_DB.prepare(
        `SELECT post_slug, post_url, post_title, pageviews, visits, updated_at
				 FROM page_stats
				 ORDER BY pageviews DESC, visits DESC, updated_at DESC
				 LIMIT ?1`,
      )
        .bind(limit)
        .all<AnalyticsRow>(),
    ]);

    let recentTrendResults: DailyRow[] = [];

    try {
      const recentTrend = await env.COMMENTS_DB.prepare(
        `SELECT
					day,
					SUM(pageviews) AS total_pv,
					SUM(visits) AS total_visits
				 FROM page_daily_stats
				 WHERE day >= ?1
				 GROUP BY day
				 ORDER BY day ASC`,
      )
        .bind(firstDay)
        .all<DailyRow>();
      recentTrendResults = recentTrend.results || [];
    } catch (error) {
      if (!isMissingPageDailyStatsTableError(error)) {
        throw error;
      }

      console.warn(
        "admin:analytics missing page_daily_stats table, returning zero-filled trend",
        error,
      );
    }

    const trendMap = new Map(
      recentTrendResults.map((item) => [
        item.day,
        {
          pageviews: Number(item.total_pv || 0),
          visits: Number(item.total_visits || 0),
        },
      ]),
    );

    return json({
      summary: {
        pageviews: Number(summary?.pageviews || 0),
        visits: Number(summary?.visits || 0),
        pageCount: Number(summary?.page_count || 0),
      },
      pages: (pages.results || []).map((item) => ({
        postSlug: item.post_slug,
        postUrl: item.post_url,
        postTitle: item.post_title,
        pageviews: Number(item.pageviews || 0),
        visits: Number(item.visits || 0),
        updatedAt: new Date(item.updated_at).toISOString(),
      })),
      recentTrend: recentDays.map((day) => ({
        day,
        pageviews: trendMap.get(day)?.pageviews || 0,
        visits: trendMap.get(day)?.visits || 0,
      })),
    });
  } catch (error) {
    console.error("admin:analytics", error);
    return serverError(COMMENT_MESSAGES.adminAnalyticsError);
  }
};
