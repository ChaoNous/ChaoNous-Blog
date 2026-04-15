import {
  badRequest,
  COMMENT_MESSAGES,
  json,
  serverError,
  type Env,
  validateAnalyticsPostSlug,
} from "../../_lib/comments";

export const onRequestGet = async ({
  env,
  request,
}: {
  env: Env;
  request: Request;
}) => {
  try {
    const url = new URL(request.url);
    const validatedPostSlug = validateAnalyticsPostSlug(
      url.searchParams.get("postSlug"),
      request.url,
    );
    if (!validatedPostSlug.ok) {
      return badRequest(validatedPostSlug.message);
    }

    const postSlug = validatedPostSlug.value;
    const row = await env.COMMENTS_DB.prepare(
      `SELECT pageviews, visits
			 FROM page_stats
			 WHERE post_slug = ?1`,
    )
      .bind(postSlug)
      .first<{ pageviews: number; visits: number }>();

    return json({
      postSlug,
      pageviews: Number(row?.pageviews || 0),
      visits: Number(row?.visits || 0),
    });
  } catch (error) {
    console.error("analytics:pv", error);
    return serverError(COMMENT_MESSAGES.analyticsReadError);
  }
};
