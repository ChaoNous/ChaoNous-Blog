import { badRequest, json, serverError, type Env } from "../../_lib/comments";

export const onRequestGet = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
}) => {
	try {
		const url = new URL(request.url);
		const postSlug = url.searchParams.get("postSlug")?.trim();
		if (!postSlug) {
			return badRequest("缺少文章标识。");
		}

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
		return serverError("统计读取失败。");
	}
};
