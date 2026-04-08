import {
	COMMENT_MESSAGES,
	createPagination,
	json,
	parsePaginationParams,
	serverError,
	requireAdminSession,
	toAdminComment,
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
	const authResponse = await requireAdminSession(
		request,
		env,
		COMMENT_MESSAGES.adminUnauthorized,
	);
	if (authResponse) {
		return authResponse;
	}

	try {
		const { url, page, limit, offset } = parsePaginationParams(
			request.url,
			20,
			100,
		);
		const search = url.searchParams.get("search")?.trim() || "";

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
			`SELECT id, parent_id, post_slug, post_url, post_title, author_name, author_email, author_url, content, created_at, updated_at
			 FROM comments
			 ${whereSql}
			 ORDER BY created_at DESC
			 LIMIT ?${paginationIndex} OFFSET ?${paginationIndex + 1}`,
		)
			.bind(...params, limit, offset)
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
			data: (rows.results || []).map(toAdminComment),
			pagination: createPagination(page, limit, totalCount),
		});
	} catch (error) {
		console.error("admin:comments:list", error);
		return serverError(COMMENT_MESSAGES.adminCommentsError);
	}
};
