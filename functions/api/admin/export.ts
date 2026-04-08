import {
	COMMENT_MESSAGES,
	requireAdminSession,
	serverError,
	type Env,
} from "../../_lib/comments";

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
		const url = new URL(request.url);
		const type = url.searchParams.get("type")?.trim() || "comments";

		if (type === "analytics") {
			const rows = await env.COMMENTS_DB.prepare(
				`SELECT post_slug, post_url, post_title, pageviews, visits, updated_at
				 FROM page_stats
				 ORDER BY updated_at DESC`,
			).all();

			return new Response(JSON.stringify(rows.results || [], null, 2), {
				headers: {
					"content-type": "application/json; charset=utf-8",
					"content-disposition":
						'attachment; filename="chaonous-analytics-export.json"',
					"cache-control": "no-store",
				},
			});
		}

		const rows = await env.COMMENTS_DB.prepare(
			`SELECT id, post_slug, post_url, post_title, parent_id, author_name, author_email, author_url, content, created_at, updated_at
			 FROM comments
			 ORDER BY created_at DESC`,
		).all();

		return new Response(JSON.stringify(rows.results || [], null, 2), {
			headers: {
				"content-type": "application/json; charset=utf-8",
				"content-disposition":
					'attachment; filename="chaonous-comments-export.json"',
				"cache-control": "no-store",
			},
		});
	} catch (error) {
		console.error("admin:export", error);
		return serverError(COMMENT_MESSAGES.exportError);
	}
};
