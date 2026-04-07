import {
	json,
	isAdminAuthorized,
	serverError,
	unauthorized,
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
	if (!(await isAdminAuthorized(request, env))) {
		return unauthorized("\u540e\u53f0\u5bc6\u7801\u4e0d\u6b63\u786e\u3002");
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

		const [summary, pages, recentTrend] = await Promise.all([
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
			env.COMMENTS_DB.prepare(
				`SELECT
					strftime('%Y-%m-%d', updated_at / 1000, 'unixepoch', 'localtime') AS day,
					SUM(pageviews) AS total_pv,
					SUM(visits) AS total_visits
				 FROM page_stats
				 GROUP BY day
				 ORDER BY day DESC
				 LIMIT 14`,
			).all<DailyRow>(),
		]);

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
			recentTrend: (recentTrend.results || []).reverse().map((item) => ({
				day: item.day,
				pageviews: Number(item.total_pv || 0),
				visits: Number(item.total_visits || 0),
			})),
		});
	} catch (error) {
		console.error("admin:analytics", error);
		return serverError("\u8bbf\u95ee\u7edf\u8ba1\u8bfb\u53d6\u5931\u8d25\u3002");
	}
};
