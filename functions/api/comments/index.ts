import {
	badRequest,
	createDeleteToken,
	json,
	nestComments,
	normalizeComment,
	serverError,
	type CommentRecord,
	type Env,
	validateSubmission,
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
		const postSlug = url.searchParams.get("postSlug")?.trim();
		const page = Math.max(
			1,
			Number.parseInt(url.searchParams.get("page") || "1", 10) || 1,
		);
		const limit = Math.min(
			100,
			Math.max(
				1,
				Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50,
			),
		);

		if (!postSlug) {
			return badRequest("\u7f3a\u5c11\u6587\u7ae0\u6807\u8bc6\u3002");
		}

		const result = await env.COMMENTS_DB.prepare(
			`SELECT id, parent_id, post_slug, post_url, post_title, author_name, author_email, author_url, content, created_at, updated_at
			 FROM comments
			 WHERE post_slug = ?1
			 ORDER BY created_at ASC
			 LIMIT ?2 OFFSET ?3`,
		)
			.bind(postSlug, limit, (page - 1) * limit)
			.all<CommentRecord>();

		const totalResult = await env.COMMENTS_DB.prepare(
			`SELECT COUNT(*) AS total_count
			 FROM comments
			 WHERE post_slug = ?1`,
		)
			.bind(postSlug)
			.first<{ total_count: number }>();

		const normalized = (result.results || []).map((record) =>
			normalizeComment(record),
		);
		const data = nestComments(normalized);
		const totalCount = Number(totalResult?.total_count || 0);

		return json({
			data,
			pagination: {
				page,
				limit,
				total: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
				totalCount,
			},
		});
	} catch (error) {
		console.error("comments:get", error);
		return serverError(
			"\u8bc4\u8bba\u8bfb\u53d6\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
		);
	}
};

export const onRequestPost = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
}) => {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const validated = validateSubmission(body);
		if (!validated.ok) {
			return badRequest(validated.message);
		}

		const now = Date.now();
		const deleteToken = createDeleteToken();

		if (validated.value.parentId) {
			const parent = await env.COMMENTS_DB.prepare(
				`SELECT id, post_slug
				 FROM comments
				 WHERE id = ?1`,
			)
				.bind(validated.value.parentId)
				.first<{ id: number; post_slug: string }>();

			if (!parent || parent.post_slug !== validated.value.postSlug) {
				return badRequest("\u56de\u590d\u76ee\u6807\u4e0d\u5b58\u5728\u3002");
			}
		}

		const inserted = await env.COMMENTS_DB.prepare(
			`INSERT INTO comments (
				post_slug, post_url, post_title,
				parent_id, author_name, author_email, author_url,
				content, delete_token, created_at, updated_at
			) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
		)
			.bind(
				validated.value.postSlug,
				validated.value.postUrl,
				validated.value.postTitle,
				validated.value.parentId,
				validated.value.name,
				validated.value.email,
				validated.value.url,
				validated.value.content,
				deleteToken,
				now,
				now,
			)
			.run();

		return json(
			{
				ok: true,
				id: inserted.meta.last_row_id,
				deleteToken,
				message: "\u8bc4\u8bba\u5df2\u53d1\u5e03\u3002",
			},
			201,
		);
	} catch (error) {
		console.error("comments:post", error);
		return serverError(
			"\u8bc4\u8bba\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
		);
	}
};
