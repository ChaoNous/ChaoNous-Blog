import {
	badRequest,
	isAdminAuthorized,
	json,
	serverError,
	unauthorized,
	type Env,
} from "../../../_lib/comments";

export const onRequestPatch = async ({
	env,
	request,
	params,
}: {
	env: Env;
	request: Request;
	params: Record<string, string | undefined>;
}) => {
	if (!isAdminAuthorized(request, env)) {
		return unauthorized("后台密码不正确。");
	}

	const id = Number.parseInt(String(params.id || ""), 10);
	if (!Number.isFinite(id) || id <= 0) {
		return badRequest("评论编号无效。");
	}

	try {
		const body = (await request.json()) as { status?: string };
		const nextStatus = body.status?.trim();
		if (
			!nextStatus ||
			!["approved", "rejected", "pending"].includes(nextStatus)
		) {
			return badRequest("目标状态无效。");
		}

		await env.COMMENTS_DB.prepare(
			`UPDATE comments
			 SET status = ?1, updated_at = ?2
			 WHERE id = ?3`,
		)
			.bind(nextStatus, Date.now(), id)
			.run();

		return json({
			ok: true,
			id,
			status: nextStatus,
		});
	} catch (error) {
		console.error("admin:comments:update", error);
		return serverError("评论状态更新失败。");
	}
};
