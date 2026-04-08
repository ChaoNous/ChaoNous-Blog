import {
	badRequest,
	COMMENT_MESSAGES,
	deleteCommentsByIds,
	json,
	notFound,
	parsePositiveId,
	serverError,
	unauthorized,
	type Env,
} from "../../_lib/comments";

export const onRequestDelete = async ({
	env,
	params,
	request,
}: {
	env: Env;
	params: { id: string };
	request: Request;
}) => {
	try {
		const id = parsePositiveId(params.id);
		if (!id) {
			return badRequest(COMMENT_MESSAGES.invalidCommentId);
		}

		const url = new URL(request.url);
		const deleteToken = url.searchParams.get("token")?.trim();

		if (!deleteToken) {
			return unauthorized(COMMENT_MESSAGES.missingDeleteToken);
		}

		const comment = await env.COMMENTS_DB.prepare(
			`SELECT id, delete_token
			 FROM comments
			 WHERE id = ?1`,
		)
			.bind(id)
			.first<{ id: number; delete_token: string | null }>();

		if (!comment) {
			return notFound(COMMENT_MESSAGES.commentNotFound);
		}

		if (!comment.delete_token || comment.delete_token !== deleteToken) {
			return unauthorized(COMMENT_MESSAGES.invalidDeleteToken);
		}

		const deletedCount = await deleteCommentsByIds(env, [id]);
		if (!deletedCount) {
			return notFound(COMMENT_MESSAGES.commentNotFound);
		}

		return json({
			ok: true,
			message: COMMENT_MESSAGES.commentDeleted,
		});
	} catch (error) {
		console.error("comments:delete", error);
		return serverError(COMMENT_MESSAGES.commentDeleteError);
	}
};
