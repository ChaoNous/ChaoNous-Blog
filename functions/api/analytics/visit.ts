import {
  badRequest,
  buildAnalyticsDayKey,
  COMMENT_MESSAGES,
  ensureSameOrigin,
  json,
  readJsonBody,
  serverError,
  type Env,
  validateAnalyticsVisit,
} from "../../_lib/comments";

export const onRequestPost = async ({
  env,
  request,
}: {
  env: Env;
  request: Request;
}) => {
  try {
    const sameOriginResponse = ensureSameOrigin(request);
    if (sameOriginResponse) {
      return sameOriginResponse;
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return badRequest(COMMENT_MESSAGES.invalidContentType);
    }

    const parsedBody = await readJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const validated = validateAnalyticsVisit(parsedBody.value, request);
    if (!validated.ok) {
      return badRequest(validated.message);
    }

    const { postSlug, postUrl, postTitle, visitorId } = validated.value;
    const now = Date.now();
    const day = buildAnalyticsDayKey(now);

    const insertedVisitor = await env.COMMENTS_DB.prepare(
      `INSERT OR IGNORE INTO page_visitors (post_slug, visitor_id, first_seen_at, last_seen_at)
			 VALUES (?1, ?2, ?3, ?4)`,
    )
      .bind(postSlug, visitorId, now, now)
      .run();
    const isNewVisitor = Number(insertedVisitor.meta.changes || 0) > 0;

    if (!isNewVisitor) {
      await env.COMMENTS_DB.prepare(
        `UPDATE page_visitors
				 SET last_seen_at = ?3
				 WHERE post_slug = ?1 AND visitor_id = ?2`,
      )
        .bind(postSlug, visitorId, now)
        .run();
    }

    await Promise.all([
      env.COMMENTS_DB.prepare(
        `INSERT INTO page_stats (post_slug, post_url, post_title, pageviews, visits, updated_at)
				 VALUES (?1, ?2, ?3, 1, ?4, ?5)
				 ON CONFLICT(post_slug) DO UPDATE SET
				   post_url = excluded.post_url,
				   post_title = excluded.post_title,
				   pageviews = page_stats.pageviews + 1,
				   visits = page_stats.visits + excluded.visits,
				   updated_at = excluded.updated_at`,
      )
        .bind(postSlug, postUrl, postTitle, isNewVisitor ? 1 : 0, now)
        .run(),
      env.COMMENTS_DB.prepare(
        `INSERT INTO page_daily_stats (post_slug, day, pageviews, visits, updated_at)
				 VALUES (?1, ?2, 1, ?3, ?4)
				 ON CONFLICT(post_slug, day) DO UPDATE SET
				   pageviews = page_daily_stats.pageviews + 1,
				   visits = page_daily_stats.visits + excluded.visits,
				   updated_at = excluded.updated_at`,
      )
        .bind(postSlug, day, isNewVisitor ? 1 : 0, now)
        .run(),
    ]);

    return json({ ok: true });
  } catch (error) {
    console.error("analytics:visit", error);
    return serverError(COMMENT_MESSAGES.analyticsWriteError);
  }
};
