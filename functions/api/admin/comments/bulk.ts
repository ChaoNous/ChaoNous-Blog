import {
  badRequest,
  COMMENT_MESSAGES,
  deleteCommentsByIds,
  ensureSameOrigin,
  json,
  readJsonBody,
  requireAdminSession,
  sanitizeCommentIds,
  serverError,
  type Env,
} from "../../../_lib/comments";

export const onRequestPost = async ({
  env,
  request,
}: {
  env: Env;
  request: Request;
}) => {
  const sameOriginResponse = ensureSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const authResponse = await requireAdminSession(
    request,
    env,
    COMMENT_MESSAGES.adminSessionExpired,
  );
  if (authResponse) {
    return authResponse;
  }

  try {
    const parsedBody = await readJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const body = parsedBody.value;
    const action = String(body.action || "").trim();
    const ids = sanitizeCommentIds(body.ids);

    if (action !== "delete") {
      return badRequest(COMMENT_MESSAGES.unsupportedBulkAction);
    }
    if (!ids.length) {
      return badRequest(COMMENT_MESSAGES.missingBulkSelection);
    }

    const deletedCount = await deleteCommentsByIds(env, ids);
    return json({
      ok: true,
      deletedCount,
      message: `????? ${deletedCount} ????`,
    });
  } catch (error) {
    console.error("admin:comments:bulk", error);
    return serverError("???????");
  }
};
