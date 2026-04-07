import {
	json,
	isAdminAuthorized,
	serverError,
	unauthorized,
	type Env,
} from "../../_lib/comments";

interface CountRow {
	total_count: number;
	approved_count: number;
	pending_count: number;
	rejected_count: number;
}

interface RecentCommentRow {
	id: number;
	post_slug: string;
	post_title: string;
	author_name: string;
	content: string;
	status: string;
	created_at: number;
}

interface HotPostRow {
	post_slug: string;
	post_title: string;
	comment_count: number;
}

interface TrendRow {
	day: string;
	total_count: number;
}

export const onRequestGet = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
}) => {
	if (!isAdminAuthorized(request, env)) {
		return unauthorized("\u540e\u53f0\u5bc6\u7801\u4e0d\u6b63\u786e\u3002");
	}

	try {
		const [counts, recentComments, hotPosts, siteAnalytics, trendRows] =
			await Promise.all([
				env.COMMENTS_DB.prepare(
					`SELECT
						COUNT(*) AS total_count,
						SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
						SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
						SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
					 FROM comments`,
				).first<CountRow>(),
				env.COMMENTS_DB.prepare(
					`SELECT id, post_slug, post_title, author_name, content, status, created_at
					 FROM comments
					 ORDER BY created_at DESC
					 LIMIT 6`,
				).all<RecentCommentRow>(),
				env.COMMENTS_DB.prepare(
					`SELECT post_slug, post_title, COUNT(*) AS comment_count
					 FROM comments
					 GROUP BY post_slug, post_title
					 ORDER BY comment_count DESC, MAX(created_at) DESC
					 LIMIT 5`,
				).all<HotPostRow>(),
				env.COMMENTS_DB.prepare(
					`SELECT
						COALESCE(SUM(pageviews), 0) AS pageviews,
						COALESCE(SUM(visits), 0) AS visits
					 FROM page_stats`,
				).first<{ pageviews: number; visits: number }>(),
				env.COMMENTS_DB.prepare(
					`SELECT
						strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS day,
						COUNT(*) AS total_count
					 FROM comments
					 WHERE created_at >= ?1
					 GROUP BY day
					 ORDER BY day ASC`,
				)
					.bind(Date.now() - 13 * 24 * 60 * 60 * 1000)
					.all<TrendRow>(),
			]);

		return json({
			commentSummary: {
				total: Number(counts?.total_count || 0),
				approved: Number(counts?.approved_count || 0),
				pending: Number(counts?.pending_count || 0),
				rejected: Number(counts?.rejected_count || 0),
			},
			analyticsSummary: {
				pageviews: Number(siteAnalytics?.pageviews || 0),
				visits: Number(siteAnalytics?.visits || 0),
			},
			recentComments: (recentComments.results || []).map((item) => ({
				id: item.id,
				postSlug: item.post_slug,
				postTitle: item.post_title,
				authorName: item.author_name,
				content: item.content,
				status: item.status,
				createdAt: new Date(item.created_at).toISOString(),
			})),
			hotPosts: (hotPosts.results || []).map((item) => ({
				postSlug: item.post_slug,
				postTitle: item.post_title,
				commentCount: Number(item.comment_count || 0),
			})),
			commentTrend: (trendRows.results || []).map((item) => ({
				day: item.day,
				total: Number(item.total_count || 0),
			})),
		});
	} catch (error) {
		console.error("admin:overview", error);
		return serverError("\u540e\u53f0\u6982\u89c8\u8bfb\u53d6\u5931\u8d25\u3002");
	}
};
