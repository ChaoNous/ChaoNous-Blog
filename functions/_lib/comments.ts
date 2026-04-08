interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	all<T>(): Promise<{ results: T[] }>;
	first<T>(): Promise<T | null>;
	run(): Promise<{ meta: { last_row_id?: number; changes?: number } }>;
}

interface D1Database {
	prepare(query: string): D1PreparedStatement;
}

export interface Env {
	COMMENTS_DB: D1Database;
	COMMENT_ADMIN_PASSWORD?: string;
	COMMENT_SESSION_SECRET?: string;
}

export interface CommentRecord {
	id: number;
	parent_id: number | null;
	post_slug: string;
	post_url: string;
	post_title: string;
	author_name: string;
	author_email: string;
	author_url: string | null;
	content: string;
	delete_token?: string | null;
	created_at: number;
	updated_at: number;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalCount: number;
}

export interface AdminCommentView {
	id: number;
	parentId: number | null;
	postSlug: string;
	postUrl: string;
	postTitle: string;
	authorName: string;
	authorEmail: string;
	authorUrl: string | null;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface NormalizedComment {
	id: number;
	parentId: number | null;
	postSlug: string;
	postUrl: string;
	postTitle: string;
	authorName: string;
	authorUrl: string | null;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export type NestedComment = NormalizedComment & {
	replies: NestedComment[];
};

export type CommentApiErrorCode =
	| "BAD_REQUEST"
	| "INVALID_JSON"
	| "UNAUTHORIZED"
	| "NOT_FOUND"
	| "SERVER_ERROR";

export interface ApiErrorPayload {
	ok: false;
	code: CommentApiErrorCode;
	message: string;
}

export interface ApiSuccessPayload<T = Record<string, never>> {
	ok: true;
	data?: T;
	message?: string;
}

export const COMMENT_MESSAGES = {
	invalidJson: "请求体不是有效的 JSON。",
	unauthorized: "未授权。",
	adminUnauthorized: "后台密码不正确。",
	adminSessionExpired: "后台会话已失效，请重新登录。",
	notFound: "资源不存在。",
	serverError: "服务暂时不可用。",
	missingPostSlug: "缺少文章标识。",
	missingPostUrl: "缺少文章链接。",
	invalidCommentId: "无效的评论 ID。",
	missingDeleteToken: "缺少删除凭证。",
	invalidDeleteToken: "删除凭证不正确。",
	commentNotFound: "评论不存在。",
	replyTargetMissing: "回复目标不存在。",
	replyTargetInvalid: "回复目标无效。",
	unsupportedBulkAction: "不支持的批量操作。",
	missingBulkSelection: "请先选择要处理的评论。",
	invalidName: "昵称必填，且不能超过 50 个字符。",
	invalidEmail: "请输入有效邮箱。",
	invalidUrl: "网址格式不正确。",
	invalidContent: "评论内容必填，且不能超过 2000 个字符。",
	commentReadError: "评论读取失败，请稍后再试。",
	commentSubmitError: "评论提交失败，请稍后再试。",
	commentDeleteError: "评论删除失败，请稍后再试。",
	commentPublished: "评论已发布。",
	commentDeleted: "评论已删除。",
	loginSuccess: "登录成功。",
	loginError: "登录失败。",
	logoutSuccess: "已退出。",
	logoutError: "退出失败。",
	sessionReadError: "会话状态读取失败。",
	exportError: "数据导出失败。",
	adminOverviewError: "后台概览读取失败。",
	adminCommentsError: "评论后台读取失败。",
	adminAnalyticsError: "访问统计读取失败。",
	bulkDeleteInProgress: "正在执行批量删除…",
} as const;

const ADMIN_SESSION_COOKIE = "cnc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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

function parseCookies(request: Request): Map<string, string> {
	const header = request.headers.get("cookie") || "";
	const cookies = new Map<string, string>();

	for (const chunk of header.split(";")) {
		const [rawName, ...rawValue] = chunk.trim().split("=");
		if (!rawName || rawValue.length === 0) continue;
		cookies.set(rawName, rawValue.join("="));
	}

	return cookies;
}

function timingSafeEqual(left: string, right: string): boolean {
	if (left.length !== right.length) return false;

	let diff = 0;
	for (let index = 0; index < left.length; index += 1) {
		diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
	}

	return diff === 0;
}

function createSessionCookie(token: string, maxAgeSeconds: number): string {
	return [
		`${ADMIN_SESSION_COOKIE}=${token}`,
		"Path=/",
		"HttpOnly",
		"Secure",
		"SameSite=Strict",
		`Max-Age=${maxAgeSeconds}`,
	].join("; ");
}

function createSessionId(): string {
	const timePart = Date.now().toString(36);
	const randomPart = Array.from({ length: 4 }, () =>
		Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
			.toString(36)
			.slice(0, 10),
	).join("");
	return `${timePart}${randomPart}`;
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

export function createDeleteToken(): string {
	return crypto.randomUUID();
}

export function getAdminSessionToken(request: Request): string {
	return parseCookies(request).get(ADMIN_SESSION_COOKIE)?.trim() || "";
}

async function deleteExpiredAdminSessions(env: Env): Promise<void> {
	await env.COMMENTS_DB.prepare(
		`DELETE FROM admin_sessions
		 WHERE expires_at <= ?1`,
	)
		.bind(Date.now())
		.run();
}

export async function createAdminSessionCookie(env: Env): Promise<string> {
	const sessionId = createSessionId();
	const now = Date.now();
	const expiresAt = now + SESSION_TTL_SECONDS * 1000;

	await deleteExpiredAdminSessions(env);
	await env.COMMENTS_DB.prepare(
		`INSERT INTO admin_sessions (id, expires_at, created_at)
		 VALUES (?1, ?2, ?3)`,
	)
		.bind(sessionId, expiresAt, now)
		.run();

	return createSessionCookie(sessionId, SESSION_TTL_SECONDS);
}

export function clearAdminSessionCookie(): string {
	return createSessionCookie("", 0);
}

export async function isAdminAuthorized(
	request: Request,
	env: Env,
): Promise<boolean> {
	const expectedPassword = env.COMMENT_ADMIN_PASSWORD?.trim();
	if (!expectedPassword) return false;

	const token = getAdminSessionToken(request);
	if (!token) return false;

	await deleteExpiredAdminSessions(env);
	const session = await env.COMMENTS_DB.prepare(
		`SELECT id
		 FROM admin_sessions
		 WHERE id = ?1
		   AND expires_at > ?2
		 LIMIT 1`,
	)
		.bind(token, Date.now())
		.first<{ id: string }>();

	return Boolean(session?.id);
}

export async function authenticateAdminPassword(
	password: string,
	env: Env,
): Promise<boolean> {
	const expected = env.COMMENT_ADMIN_PASSWORD?.trim();
	if (!expected) return false;
	return timingSafeEqual(expected, password.trim());
}

export async function deleteAdminSession(
	env: Env,
	sessionId: string,
): Promise<void> {
	if (!sessionId) return;

	await env.COMMENTS_DB.prepare(
		`DELETE FROM admin_sessions
		 WHERE id = ?1`,
	)
		.bind(sessionId)
		.run();
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
	const map = new Map<number, NestedComment>();
	const roots: NestedComment[] = [];

	for (const record of records) {
		map.set(record.id, {
			...record,
			replies: [],
		});
	}

	for (const record of map.values()) {
		if (record.parentId && map.has(record.parentId)) {
			map.get(record.parentId)!.replies.push(record);
			continue;
		}
		roots.push(record);
	}

	return roots;
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
	message = COMMENT_MESSAGES.unauthorized,
): Response {
	return errorResponse("UNAUTHORIZED", message, 401);
}

export function notFound(message = COMMENT_MESSAGES.notFound): Response {
	return errorResponse("NOT_FOUND", message, 404);
}

export function serverError(
	message = COMMENT_MESSAGES.serverError,
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
	message = COMMENT_MESSAGES.adminUnauthorized,
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
	const postSlug = String(body.postSlug || "").trim();
	const postUrl = String(body.postUrl || "").trim();
	const postTitle = String(body.postTitle || "").trim();
	const name = String(body.name || "").trim();
	const email = String(body.email || "").trim();
	const rawUrl = String(body.url || "").trim();
	const content = String(body.content || "").trim();
	const parentIdRaw = String(body.parentId || "").trim();
	const parentId = parentIdRaw ? Number.parseInt(parentIdRaw, 10) : null;

	if (!postSlug) {
		return { ok: false, message: COMMENT_MESSAGES.missingPostSlug } as const;
	}
	if (!postUrl) {
		return { ok: false, message: COMMENT_MESSAGES.missingPostUrl } as const;
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
