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
		return unauthorized("????????");
	}

	try {
		const url = new URL(request.url);
		const status = url.searchParams.get("status")?.trim() || "pending";
		const rows = await env.COMMENTS_DB.prepare(
			`SELECT id, parent_id, post_slug, post_url, post_title, author_name, author_email, author_url, content, status, created_at, updated_at
			 FROM comments
			 WHERE status = ?1
			 ORDER BY created_at DESC
			 LIMIT 200`,
		)
			.bind(status)
			.all<CommentRecord>();

		return json({
			data: (rows.results || []).map((record) => normalizeComment(record)),
		});
	} catch (error) {
		console.error("admin:comments:list", error);
		return serverError("?????????");
	}
};
