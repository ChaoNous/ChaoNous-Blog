import { json, serverError, type Env } from "../../_lib/comments";

export const onRequestGet = async ({
	env,
}: {
	env: Env;
	request: Request;
}) => {
	try {
		const row = await env.COMMENTS_DB.prepare(
			`SELECT
			   COALESCE(SUM(pageviews), 0) AS pageviews,
			   COALESCE(SUM(visits), 0) AS visits
			 FROM page_stats`,
		).first<{ pageviews: number; visits: number }>();

		return json({
			pageviews: Number(row?.pageviews || 0),
			visits: Number(row?.visits || 0),
		});
	} catch (error) {
		console.error("analytics:site", error);
		return serverError("站点统计读取失败。");
	}
};
