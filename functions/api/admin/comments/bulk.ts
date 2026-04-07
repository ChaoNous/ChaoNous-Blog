import {
	badRequest,
	deleteCommentsByIds,
	json,
	isAdminAuthorized,
	sanitizeCommentIds,
	serverError,
	unauthorized,
	type Env,
} from "../../../_lib/comments";

export const onRequestPost = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
}) => {
	if (!(await isAdminAuthorized(request, env))) {
		return unauthorized("\u540e\u53f0\u4f1a\u8bdd\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002");
	}

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const action = String(body.action || "").trim();
		const ids = sanitizeCommentIds(body.ids);

		if (action !== "delete") {
			return badRequest("\u4e0d\u652f\u6301\u7684\u6279\u91cf\u64cd\u4f5c\u3002");
		}
		if (!ids.length) {
			return badRequest("\u8bf7\u5148\u9009\u62e9\u8981\u5904\u7406\u7684\u8bc4\u8bba\u3002");
		}

		const deletedCount = await deleteCommentsByIds(env, ids);
		return json({
			ok: true,
			deletedCount,
			message: `\u5df2\u6279\u91cf\u5220\u9664 ${deletedCount} \u6761\u8bc4\u8bba\u3002`,
		});
	} catch (error) {
		console.error("admin:comments:bulk", error);
		return serverError("\u6279\u91cf\u64cd\u4f5c\u5931\u8d25\u3002");
	}
};
