import {
	deleteCommentsByIds,
	json,
	isAdminAuthorized,
	notFound,
	parsePositiveId,
	serverError,
	unauthorized,
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
	if (!(await isAdminAuthorized(request, env))) {
		return unauthorized("\u540e\u53f0\u4f1a\u8bdd\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002");
	}

	try {
		const id = parsePositiveId(params.id);
		if (!id) {
			return notFound("\u8bc4\u8bba\u4e0d\u5b58\u5728\u3002");
		}

		const deletedCount = await deleteCommentsByIds(env, [id]);
		if (!deletedCount) {
			return notFound("\u8bc4\u8bba\u4e0d\u5b58\u5728\u3002");
		}

		return json({
			ok: true,
			deletedCount,
			message:
				deletedCount > 1
					? `\u5df2\u5220\u9664 ${deletedCount} \u6761\u8bc4\u8bba\u3002`
					: "\u8bc4\u8bba\u5df2\u5220\u9664\u3002",
		});
	} catch (error) {
		console.error("admin:comments:delete", error);
		return serverError("\u5220\u9664\u8bc4\u8bba\u5931\u8d25\u3002");
	}
};
