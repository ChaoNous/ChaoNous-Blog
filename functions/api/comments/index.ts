import {
	badRequest,
	COMMENT_MESSAGES,
	createPagination,
	createDeleteToken,
	json,
	nestComments,
	normalizeComment,
	parsePaginationParams,
	readJsonBody,
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
		const { url, page, limit, offset } = parsePaginationParams(
			request.url,
			50,
			100,
		);
		const postSlug = url.searchParams.get("postSlug")?.trim();

		if (!postSlug) {
			return badRequest(COMMENT_MESSAGES.missingPostSlug);
		}

		const result = await env.COMMENTS_DB.prepare(
			`SELECT id, parent_id, post_slug, post_url, post_title, author_name, author_email, author_url, content, created_at, updated_at
			 FROM comments
			 WHERE post_slug = ?1
			 ORDER BY created_at ASC
			 LIMIT ?2 OFFSET ?3`,
		)
			.bind(postSlug, limit, offset)
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
			pagination: createPagination(page, limit, totalCount),
		});
	} catch (error) {
		console.error("comments:get", error);
		return serverError(COMMENT_MESSAGES.commentReadError);
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
		const parsedBody = await readJsonBody(request);
		if (!parsedBody.ok) {
			return parsedBody.response;
		}

		const body = parsedBody.value;
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
				return badRequest(COMMENT_MESSAGES.replyTargetMissing);
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
				message: COMMENT_MESSAGES.commentPublished,
			},
			201,
		);
	} catch (error) {
		console.error("comments:post", error);
		return serverError(COMMENT_MESSAGES.commentSubmitError);
	}
};
