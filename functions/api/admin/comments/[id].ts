import {
	COMMENT_MESSAGES,
	deleteCommentsByIds,
	json,
	notFound,
	parsePositiveId,
	requireAdminSession,
	serverError,
	type Env,
} from "../../../_lib/comments";

export const onRequestDelete = async ({
	env,
	request,
	params,
}: {
	env: Env;
	request: Request;
	params: Record<string, string | undefined>;
}) => {
	const authResponse = await requireAdminSession(
		request,
		env,
		COMMENT_MESSAGES.adminSessionExpired,
	);
	if (authResponse) {
		return authResponse;
	}

	try {
		const id = parsePositiveId(params.id);
		if (!id) {
			return notFound(COMMENT_MESSAGES.commentNotFound);
		}

		const deletedCount = await deleteCommentsByIds(env, [id]);
		if (!deletedCount) {
			return notFound(COMMENT_MESSAGES.commentNotFound);
		}

		return json({
			ok: true,
			deletedCount,
			message:
				deletedCount > 1
					? `\u5df2\u5220\u9664 ${deletedCount} \u6761\u8bc4\u8bba\u3002`
					: COMMENT_MESSAGES.commentDeleted,
		});
	} catch (error) {
		console.error("admin:comments:delete", error);
		return serverError("删除评论失败。");
	}
};
