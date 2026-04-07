import {
	json,
	isAdminAuthorized,
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
	if (!(await isAdminAuthorized(request, env))) {
		return unauthorized("\u540e\u53f0\u5bc6\u7801\u4e0d\u6b63\u786e\u3002");
	}

	try {
		return json({
			site: {
				title: "ChaoNous Blog",
				adminPath: "/admin/",
				commentApiPath: "/api/comments",
				adminApiPath: "/api/admin/comments",
				analyticsApiPath: "/api/admin/analytics",
			},
			comment: {
				publishMode: "direct",
				threadKey: "canonicalUrl",
				storage: "Cloudflare D1",
				runtime: "Cloudflare Pages Functions",
			},
			security: {
				authMode: "session-cookie",
				sessionCookie: "cnc_admin_session",
				loginApiPath: "/api/admin/session",
			},
		});
	} catch (error) {
		console.error("admin:settings", error);
		return serverError("\u7ad9\u70b9\u8bbe\u7f6e\u8bfb\u53d6\u5931\u8d25\u3002");
	}
};
