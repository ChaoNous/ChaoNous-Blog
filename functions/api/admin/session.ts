import {
	authenticateAdminPassword,
	clearAdminSessionCookie,
	createAdminSessionCookie,
	deleteAdminSession,
	getAdminSessionToken,
	json,
	isAdminAuthorized,
	readJsonBody,
	serverError,
	unauthorized,
	type Env,
} from "../../_lib/comments";

export const onRequestGet = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
}) => {
	try {
		const authorized = await isAdminAuthorized(request, env);
		return json({
			authenticated: authorized,
		});
	} catch (error) {
		console.error("admin:session:get", error);
		return serverError("\u4f1a\u8bdd\u72b6\u6001\u8bfb\u53d6\u5931\u8d25\u3002");
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
		const password = String(body.password || "").trim();

		if (!(await authenticateAdminPassword(password, env))) {
			return unauthorized("\u540e\u53f0\u5bc6\u7801\u4e0d\u6b63\u786e\u3002");
		}

		return json(
			{
				ok: true,
				message: "\u767b\u5f55\u6210\u529f\u3002",
			},
			200,
			{
				"set-cookie": await createAdminSessionCookie(env),
			},
		);
	} catch (error) {
		console.error("admin:session:post", error);
		return serverError("\u767b\u5f55\u5931\u8d25\u3002");
	}
};

export const onRequestDelete = async ({
	env,
	request,
}: {
	env: Env;
	request: Request;
}) => {
	try {
		await deleteAdminSession(env, getAdminSessionToken(request));
		return json(
			{
				ok: true,
				message: "\u5df2\u9000\u51fa\u3002",
			},
			200,
			{
				"set-cookie": clearAdminSessionCookie(),
			},
		);
	} catch (error) {
		console.error("admin:session:delete", error);
		return serverError("\u9000\u51fa\u5931\u8d25\u3002");
	}
};
