import {
	authenticateAdminPassword,
	clearAdminSessionCookie,
	COMMENT_MESSAGES,
	createAdminSessionCookie,
	deleteAdminSession,
	ensureSameOrigin,
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
		return serverError(COMMENT_MESSAGES.sessionReadError);
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
		const sameOriginResponse = ensureSameOrigin(request);
		if (sameOriginResponse) {
			return sameOriginResponse;
		}

		const parsedBody = await readJsonBody(request);
		if (!parsedBody.ok) {
			return parsedBody.response;
		}

		const body = parsedBody.value;
		const password = String(body.password || "").trim();

		if (!(await authenticateAdminPassword(password, env))) {
			return unauthorized(COMMENT_MESSAGES.adminUnauthorized);
		}

		return json(
			{
				ok: true,
				message: COMMENT_MESSAGES.loginSuccess,
			},
			200,
			{
				"set-cookie": await createAdminSessionCookie(env),
			},
		);
	} catch (error) {
		console.error("admin:session:post", error);
		return serverError(COMMENT_MESSAGES.loginError);
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
		const sameOriginResponse = ensureSameOrigin(request);
		if (sameOriginResponse) {
			return sameOriginResponse;
		}

		await deleteAdminSession(env, getAdminSessionToken(request));
		return json(
			{
				ok: true,
				message: COMMENT_MESSAGES.logoutSuccess,
			},
			200,
			{
				"set-cookie": clearAdminSessionCookie(),
			},
		);
	} catch (error) {
		console.error("admin:session:delete", error);
		return serverError(COMMENT_MESSAGES.logoutError);
	}
};
