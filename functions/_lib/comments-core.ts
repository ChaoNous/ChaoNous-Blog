import { isAdminAuthorized } from "./comments-auth";
import {
  COMMENT_SUBMISSION_POLICY,
  evaluateSubmissionContentPolicy,
  evaluateSubmissionRateLimit,
  parseFormLoadedAt,
} from "./comments-antiabuse.js";
import { COMMENT_MESSAGES } from "./comments-messages";
import {
  buildNestedComments,
  paginateNestedComments as paginateNestedCommentsHelper,
} from "./comments-threading.js";
import type {
  AdminCommentView,
  ApiErrorPayload,
  CommentApiErrorCode,
  CommentRecord,
  Env,
  NestedComment,
  NormalizedComment,
  PaginationMeta,
} from "./comments-types";

function errorResponse(
  code: CommentApiErrorCode,
  message: string,
  status: number,
): Response {
  return json(
    {
      ok: false,
      code,
      message,
    } satisfies ApiErrorPayload,
    status,
  );
}

function normalizeOptionalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(normalized).toString();
  } catch {
    return null;
  }
}

function normalizeRequiredUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function json(
  data: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(headers || {}),
    },
  });
}

export function createDeleteToken(): string {
  return crypto.randomUUID();
}

export function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function normalizeComment(record: CommentRecord): NormalizedComment {
  return {
    id: record.id,
    parentId: record.parent_id,
    postSlug: record.post_slug,
    postUrl: record.post_url,
    postTitle: record.post_title,
    authorName: record.author_name,
    authorUrl: record.author_url,
    content: record.content,
    createdAt: toIso(record.created_at),
    updatedAt: toIso(record.updated_at),
  };
}

export function toAdminComment(record: CommentRecord): AdminCommentView {
  return {
    id: record.id,
    parentId: record.parent_id,
    postSlug: record.post_slug,
    postUrl: record.post_url,
    postTitle: record.post_title,
    authorName: record.author_name,
    authorEmail: record.author_email,
    authorUrl: record.author_url,
    content: record.content,
    createdAt: toIso(record.created_at),
    updatedAt: toIso(record.updated_at),
  };
}

export function nestComments(records: NormalizedComment[]): NestedComment[] {
  return buildNestedComments(records) as NestedComment[];
}

export function paginateNestedComments(
  records: NormalizedComment[],
  page: number,
  limit: number,
): { data: NestedComment[]; totalCount: number } {
  return paginateNestedCommentsHelper(records, page, limit) as {
    data: NestedComment[];
    totalCount: number;
  };
}

export function createPagination(
  page: number,
  limit: number,
  totalCount: number,
): PaginationMeta {
  return {
    page,
    limit,
    total: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
    totalCount,
  };
}

export function badRequest(message: string): Response {
  return errorResponse("BAD_REQUEST", message, 400);
}

export function unauthorized(
  message: string = COMMENT_MESSAGES.unauthorized,
): Response {
  return errorResponse("UNAUTHORIZED", message, 401);
}

export function tooManyRequests(message: string): Response {
  return errorResponse("TOO_MANY_REQUESTS", message, 429);
}

export function ensureSameOrigin(
  request: Request,
  message: string = COMMENT_MESSAGES.invalidOrigin,
): Response | null {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) {
    return null;
  }

  return unauthorized(message);
}

export function notFound(
  message: string = COMMENT_MESSAGES.notFound,
): Response {
  return errorResponse("NOT_FOUND", message, 404);
}

export function serverError(
  message: string = COMMENT_MESSAGES.serverError,
): Response {
  return errorResponse("SERVER_ERROR", message, 500);
}

export async function readJsonBody(
  request: Request,
): Promise<
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; response: Response }
> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return { ok: true, value: body };
  } catch {
    return {
      ok: false,
      response: errorResponse(
        "INVALID_JSON",
        COMMENT_MESSAGES.invalidJson,
        400,
      ),
    };
  }
}

export async function requireAdminSession(
  request: Request,
  env: Env,
  message: string = COMMENT_MESSAGES.adminUnauthorized,
): Promise<Response | null> {
  if (await isAdminAuthorized(request, env)) {
    return null;
  }

  return unauthorized(message);
}

export function parsePaginationParams(
  requestUrl: string,
  defaultLimit = 20,
  maxLimit = 100,
) {
  const url = new URL(requestUrl);
  const page = Math.max(
    1,
    Number.parseInt(url.searchParams.get("page") || "1", 10) || 1,
  );
  const limit = Math.min(
    maxLimit,
    Math.max(
      1,
      Number.parseInt(
        url.searchParams.get("limit") || String(defaultLimit),
        10,
      ) || defaultLimit,
    ),
  );

  return {
    url,
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function parsePositiveId(value: unknown): number | null {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function validateSubmission(body: Record<string, unknown>) {
  const postSlug = normalizeRequiredUrl(String(body.postSlug || ""));
  const postUrl = normalizeRequiredUrl(String(body.postUrl || ""));
  const postTitle = String(body.postTitle || "").trim();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const rawUrl = String(body.url || "").trim();
  const content = String(body.content || "").trim();
  const parentIdRaw = String(body.parentId || "").trim();
  const parentId = parentIdRaw ? Number.parseInt(parentIdRaw, 10) : null;

  if (!postSlug) {
    return { ok: false, message: COMMENT_MESSAGES.invalidPostSlug } as const;
  }
  if (!postUrl) {
    return { ok: false, message: COMMENT_MESSAGES.invalidPostUrl } as const;
  }
  if (!postTitle || postTitle.length > 160) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidSubmission,
    } as const;
  }
  if (!name || name.length > 50) {
    return { ok: false, message: COMMENT_MESSAGES.invalidName } as const;
  }
  if (
    !email ||
    email.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, message: COMMENT_MESSAGES.invalidEmail } as const;
  }

  const normalizedUrl = normalizeOptionalUrl(rawUrl);
  if (rawUrl && !normalizedUrl) {
    return { ok: false, message: COMMENT_MESSAGES.invalidUrl } as const;
  }

  if (!content || content.length > 2000) {
    return { ok: false, message: COMMENT_MESSAGES.invalidContent } as const;
  }

  if (parentIdRaw && (!Number.isFinite(parentId) || (parentId ?? 0) <= 0)) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.replyTargetInvalid,
    } as const;
  }

  return {
    ok: true,
    value: {
      postSlug,
      postUrl,
      postTitle,
      name,
      email,
      url: normalizedUrl,
      content,
      parentId,
    },
  } as const;
}

export function validateSubmissionMetadata(body: Record<string, unknown>) {
  const formLoadedAt = parseFormLoadedAt(body.formLoadedAt);
  const contentPolicy = evaluateSubmissionContentPolicy({
    website: String(body.website || ""),
    content: String(body.content || ""),
    formLoadedAt,
  });

  if (!contentPolicy.ok) {
    switch (contentPolicy.reason) {
      case "submitted_too_fast":
        return {
          ok: false,
          message: COMMENT_MESSAGES.submissionTooFast,
          shouldRateLimit: true,
        } as const;
      case "too_many_links":
        return {
          ok: false,
          message: COMMENT_MESSAGES.commentTooManyLinks,
          shouldRateLimit: false,
        } as const;
      default:
        return {
          ok: false,
          message: COMMENT_MESSAGES.invalidSubmission,
          shouldRateLimit: false,
        } as const;
    }
  }

  return {
    ok: true,
    value: {
      formLoadedAt,
    },
  } as const;
}

export async function enforceSubmissionRateLimit(
  env: Env,
  input: {
    postSlug: string;
    email: string;
    content: string;
    now?: number;
  },
) {
  const now = input.now ?? Date.now();

  const [postWindowRow, globalWindowRow, duplicateRow] = await Promise.all([
    env.COMMENTS_DB.prepare(
      `SELECT COUNT(*) AS recent_count, MAX(created_at) AS last_created_at
       FROM comments
       WHERE post_slug = ?1
         AND author_email = ?2
         AND created_at >= ?3`,
    )
      .bind(
        input.postSlug,
        input.email,
        now - COMMENT_SUBMISSION_POLICY.recentPostWindowMs,
      )
      .first<{ recent_count: number; last_created_at: number | null }>(),
    env.COMMENTS_DB.prepare(
      `SELECT COUNT(*) AS recent_count
       FROM comments
       WHERE author_email = ?1
         AND created_at >= ?2`,
    )
      .bind(
        input.email,
        now - COMMENT_SUBMISSION_POLICY.recentGlobalWindowMs,
      )
      .first<{ recent_count: number }>(),
    env.COMMENTS_DB.prepare(
      `SELECT MAX(created_at) AS last_created_at
       FROM comments
       WHERE post_slug = ?1
         AND author_email = ?2
         AND content = ?3
         AND created_at >= ?4`,
    )
      .bind(
        input.postSlug,
        input.email,
        input.content,
        now - COMMENT_SUBMISSION_POLICY.duplicateWindowMs,
      )
      .first<{ last_created_at: number | null }>(),
  ]);

  const decision = evaluateSubmissionRateLimit({
    now,
    recentPostCount: Number(postWindowRow?.recent_count || 0),
    recentGlobalCount: Number(globalWindowRow?.recent_count || 0),
    lastPostCreatedAt: postWindowRow?.last_created_at ?? null,
    lastDuplicateCreatedAt: duplicateRow?.last_created_at ?? null,
  });

  if (decision.ok) {
    return { ok: true } as const;
  }

  return {
    ok: false,
    message:
      decision.reason === "duplicate_content"
        ? COMMENT_MESSAGES.duplicateComment
        : COMMENT_MESSAGES.commentRateLimited,
  } as const;
}

export function sanitizeCommentIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  const ids = value
    .map((item) => Number.parseInt(String(item), 10))
    .filter((item) => Number.isFinite(item) && item > 0);

  return Array.from(new Set(ids));
}

export async function deleteCommentsByIds(
  env: Env,
  ids: number[],
): Promise<number> {
  const uniqueIds = Array.from(
    new Set(ids.filter((id) => Number.isFinite(id) && id > 0)),
  );
  if (!uniqueIds.length) return 0;

  const placeholders = uniqueIds.map((_, index) => `?${index + 1}`).join(", ");
  const subtreeSql = `
    WITH RECURSIVE subtree(id) AS (
      SELECT id
      FROM comments
      WHERE id IN (${placeholders})
      UNION ALL
      SELECT comments.id
      FROM comments
      INNER JOIN subtree ON comments.parent_id = subtree.id
    )
  `;

  const countRow = await env.COMMENTS_DB.prepare(
    `${subtreeSql}
     SELECT COUNT(DISTINCT id) AS total_count
     FROM subtree`,
  )
    .bind(...uniqueIds)
    .first<{ total_count: number }>();

  const totalCount = Number(countRow?.total_count || 0);
  if (!totalCount) return 0;

  await env.COMMENTS_DB.prepare(
    `${subtreeSql}
     DELETE FROM comments
     WHERE id IN (SELECT DISTINCT id FROM subtree)`,
  )
    .bind(...uniqueIds)
    .run();

  return totalCount;
}
