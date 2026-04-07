import {
	json,
	isAdminAuthorized,
	normalizeComment,
	serverError,
	unauthorized,
	type CommentRecord,
	type Env,
} from "../../../_lib/comments";

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
		const url = new URL(request.url);
		const search = url.searchParams.get("search")?.trim() || "";
		const page = Math.max(
			1,
			Number.parseInt(url.searchParams.get("page") || "1", 10) || 1,
		);
		const limit = Math.min(
			100,
			Math.max(
				1,
				Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20,
			),
		);

		const params: unknown[] = [];
		let whereSql = "";

		if (search) {
			const keyword = `%${search.replace(/\s+/g, "%")}%`;
			whereSql = `
				WHERE (
					post_title LIKE ?1
					OR post_slug LIKE ?2
					OR author_name LIKE ?3
					OR author_email LIKE ?4
					OR content LIKE ?5
				)
			`;
			params.push(keyword, keyword, keyword, keyword, keyword);
		}

		const paginationIndex = params.length + 1;

		const rows = await env.COMMENTS_DB.prepare(
			`SELECT id, parent_id, post_slug, post_url, post_title, author_name, author_email, author_url, content, status, created_at, updated_at
			 FROM comments
			 ${whereSql}
			 ORDER BY created_at DESC
			 LIMIT ?${paginationIndex} OFFSET ?${paginationIndex + 1}`,
		)
			.bind(...params, limit, (page - 1) * limit)
			.all<CommentRecord>();

		const total = await env.COMMENTS_DB.prepare(
			`SELECT COUNT(*) AS total_count
			 FROM comments
			 ${whereSql}`,
		)
			.bind(...params)
			.first<{ total_count: number }>();

		const totalCount = Number(total?.total_count || 0);

		return json({
			data: (rows.results || []).map((record) => normalizeComment(record)),
			pagination: {
				page,
				limit,
				totalCount,
				total: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
			},
		});
	} catch (error) {
		console.error("admin:comments:list", error);
		return serverError("\u8bc4\u8bba\u540e\u53f0\u8bfb\u53d6\u5931\u8d25\u3002");
	}
};
