import {
  badRequest,
  COMMENT_SUBMISSION_POLICY,
  COMMENT_MESSAGES,
  createPagination,
  createDeleteToken,
  enforceAnonymousSubmissionThrottle,
  enforceSubmissionRateLimit,
  ensureSameOrigin,
  json,
  nestComments,
  normalizeComment,
  parsePaginationParams,
  readJsonBody,
  serverError,
  tooManyRequests,
  type CommentRecord,
  type Env,
  validateSubmission,
  validateSubmissionMetadata,
} from "../../_lib/comments";

export const onRequestGet = async ({
  env,
  request,
}: {
  env: Env;
  request: Request;
}) => {
  try {
    const { url, page, limit, offset } = parsePaginationParams(
      request.url,
      50,
      100,
    );
    const postSlug = url.searchParams.get("postSlug")?.trim();

    if (!postSlug) {
      return badRequest(COMMENT_MESSAGES.missingPostSlug);
    }

    const totalRoots = await env.COMMENTS_DB.prepare(
      `SELECT COUNT(*) AS total_count
       FROM comments AS current
       LEFT JOIN comments AS parent
         ON parent.id = current.parent_id
        AND parent.post_slug = current.post_slug
       WHERE current.post_slug = ?1
         AND (current.parent_id IS NULL OR parent.id IS NULL)`,
    )
      .bind(postSlug)
      .first<{ total_count: number }>();

    const result = await env.COMMENTS_DB.prepare(
      `WITH root_threads AS (
         SELECT current.id
         FROM comments AS current
         LEFT JOIN comments AS parent
           ON parent.id = current.parent_id
          AND parent.post_slug = current.post_slug
         WHERE current.post_slug = ?1
           AND (current.parent_id IS NULL OR parent.id IS NULL)
         ORDER BY current.created_at ASC, current.id ASC
         LIMIT ?2 OFFSET ?3
       ),
       thread_comments AS (
         SELECT id, parent_id, post_slug, post_url, post_title, author_name, author_email, author_url, content, created_at, updated_at
         FROM comments
         WHERE id IN (SELECT id FROM root_threads)
         UNION ALL
         SELECT child.id, child.parent_id, child.post_slug, child.post_url, child.post_title, child.author_name, child.author_email, child.author_url, child.content, child.created_at, child.updated_at
         FROM comments AS child
         INNER JOIN thread_comments AS parent_thread
           ON child.parent_id = parent_thread.id
       )
       SELECT DISTINCT id, parent_id, post_slug, post_url, post_title, author_name, author_email, author_url, content, created_at, updated_at
       FROM thread_comments
       ORDER BY created_at ASC, id ASC`,
    )
      .bind(postSlug, limit, offset)
      .all<CommentRecord>();

    const normalized = (result.results || []).map((record) =>
      normalizeComment(record),
    );
    const totalCount = Number(totalRoots?.total_count || 0);

    return json({
      data: nestComments(normalized),
      pagination: createPagination(page, limit, totalCount),
    });
  } catch (error) {
    console.error("comments:get", error);
    return serverError(COMMENT_MESSAGES.commentReadError);
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

		const contentType = request.headers.get("content-type") || "";
		if (!contentType.toLowerCase().includes("application/json")) {
			return badRequest(COMMENT_MESSAGES.invalidContentType);
		}

		const parsedBody = await readJsonBody(request);
		if (!parsedBody.ok) {
			return parsedBody.response;
		}

    const body = parsedBody.value;
    const validated = validateSubmission(body);
    if (!validated.ok) {
      return badRequest(validated.message);
    }

    const metadata = validateSubmissionMetadata(body);
    if (!metadata.ok) {
      return metadata.shouldRateLimit
        ? tooManyRequests(
            metadata.message,
            metadata.retryAfterSeconds ?? 60,
          )
        : badRequest(metadata.message);
    }

    const now = Date.now();
    const deleteToken = createDeleteToken();

    const rateLimit = await enforceSubmissionRateLimit(env, {
      postSlug: validated.value.postSlug,
      email: validated.value.email,
      content: validated.value.content,
      now,
    });
    if (!rateLimit.ok) {
      return tooManyRequests(
        rateLimit.message,
        rateLimit.retryAfterSeconds ?? 60,
      );
    }

    const anonymousRateLimit = enforceAnonymousSubmissionThrottle({
      request,
      postSlug: validated.value.postSlug,
      now,
    });
    if (!anonymousRateLimit.ok) {
      return tooManyRequests(
        COMMENT_MESSAGES.commentRateLimited,
        Math.ceil(
          COMMENT_SUBMISSION_POLICY.minSubmitIntervalMs / 1000,
        ),
      );
    }

    if (validated.value.parentId) {
      const parent = await env.COMMENTS_DB.prepare(
        `SELECT id, post_slug
         FROM comments
         WHERE id = ?1`,
      )
        .bind(validated.value.parentId)
        .first<{ id: number; post_slug: string }>();

      if (!parent || parent.post_slug !== validated.value.postSlug) {
        return badRequest(COMMENT_MESSAGES.replyTargetMissing);
      }
    }

    const inserted = await env.COMMENTS_DB.prepare(
      `INSERT INTO comments (
        post_slug, post_url, post_title,
        parent_id, author_name, author_email, author_url,
        content, delete_token, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
      .bind(
        validated.value.postSlug,
        validated.value.postUrl,
        validated.value.postTitle,
        validated.value.parentId,
        validated.value.name,
        validated.value.email,
        validated.value.url,
        validated.value.content,
        deleteToken,
        now,
        now,
      )
      .run();

    return json(
      {
        ok: true,
        id: inserted.meta.last_row_id,
        deleteToken,
        message: COMMENT_MESSAGES.commentPublished,
      },
      201,
    );
  } catch (error) {
    console.error("comments:post", error);
    return serverError(COMMENT_MESSAGES.commentSubmitError);
  }
};
