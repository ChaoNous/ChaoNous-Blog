import { badRequest, json, serverError, type Env } from "../../_lib/comments";

type VisitPayload = {
	postSlug?: string;
	postUrl?: string;
	postTitle?: string;
	visitorId?: string;
};

export const onRequestPost = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
}) => {
	try {
		const body = (await request.json()) as VisitPayload;
		const postSlug = String(body.postSlug || "").trim();
		const postUrl = String(body.postUrl || "").trim();
		const postTitle = String(body.postTitle || "").trim();
		const visitorId = String(body.visitorId || "").trim();

		if (!postSlug || !postUrl || !visitorId) {
			return badRequest("缺少统计参数。");
		}

		const now = Date.now();
		const existing = await env.COMMENTS_DB.prepare(
			`SELECT visitor_id
			 FROM page_visitors
			 WHERE post_slug = ?1 AND visitor_id = ?2`,
		)
			.bind(postSlug, visitorId)
			.first<{ visitor_id: string }>();

		await env.COMMENTS_DB.prepare(
			`INSERT INTO page_stats (post_slug, post_url, post_title, pageviews, visits, updated_at)
			 VALUES (?1, ?2, ?3, 1, ?4, ?5)
			 ON CONFLICT(post_slug) DO UPDATE SET
			   post_url = excluded.post_url,
			   post_title = excluded.post_title,
			   pageviews = page_stats.pageviews + 1,
			   visits = page_stats.visits + excluded.visits,
			   updated_at = excluded.updated_at`,
		)
			.bind(postSlug, postUrl, postTitle, existing ? 0 : 1, now)
			.run();

		if (existing) {
			await env.COMMENTS_DB.prepare(
				`UPDATE page_visitors
				 SET last_seen_at = ?3
				 WHERE post_slug = ?1 AND visitor_id = ?2`,
			)
				.bind(postSlug, visitorId, now)
				.run();
		} else {
			await env.COMMENTS_DB.prepare(
				`INSERT INTO page_visitors (post_slug, visitor_id, first_seen_at, last_seen_at)
				 VALUES (?1, ?2, ?3, ?4)`,
			)
				.bind(postSlug, visitorId, now, now)
				.run();
		}

		return json({ ok: true });
	} catch (error) {
		console.error("analytics:visit", error);
		return serverError("统计写入失败。");
	}
};
