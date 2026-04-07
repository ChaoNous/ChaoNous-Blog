import {
	badRequest,
	isAdminAuthorized,
	serverError,
	unauthorized,
	type Env,
} from "../../../_lib/comments";

export const onRequestPatch = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
	params: Record<string, string | undefined>;
}) => {
	if (!isAdminAuthorized(request, env)) {
		return unauthorized("\u540e\u53f0\u5bc6\u7801\u4e0d\u6b63\u786e\u3002");
	}

	try {
		await request.text();
		return badRequest(
			"\u8bc4\u8bba\u72b6\u6001\u7ba1\u7406\u5df2\u79fb\u9664\uff0c\u6240\u6709\u8bc4\u8bba\u90fd\u4f1a\u76f4\u63a5\u53d1\u5e03\u3002",
		);
	} catch (error) {
		console.error("admin:comments:update-disabled", error);
		return serverError("\u8bc4\u8bba\u540e\u53f0\u8bf7\u6c42\u5931\u8d25\u3002");
	}
};
