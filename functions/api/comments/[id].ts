import {
	badRequest,
	json,
	notFound,
	parsePositiveId,
	serverError,
	softDeleteComment,
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
			return badRequest("\u65e0\u6548\u7684\u8bc4\u8bba ID\u3002");
		}

		const url = new URL(request.url);
		const deleteToken = url.searchParams.get("token")?.trim();

		if (!deleteToken) {
			return unauthorized("\u7f3a\u5c11\u5220\u9664\u51ed\u8bc1\u3002");
		}

		const comment = await env.COMMENTS_DB.prepare(
			`SELECT id, delete_token
			 FROM comments
			 WHERE id = ?1`,
		)
			.bind(id)
			.first<{ id: number; delete_token: string | null }>();

		if (!comment) {
			return notFound("\u8bc4\u8bba\u4e0d\u5b58\u5728\u3002");
		}

		if (!comment.delete_token || comment.delete_token !== deleteToken) {
			return unauthorized("\u5220\u9664\u51ed\u8bc1\u4e0d\u6b63\u786e\u3002");
		}

		await softDeleteComment(env, id);

		return json({
			ok: true,
			message: "\u8bc4\u8bba\u5df2\u5220\u9664\u3002",
		});
	} catch (error) {
		console.error("comments:delete", error);
		return serverError(
			"\u8bc4\u8bba\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
		);
	}
};
