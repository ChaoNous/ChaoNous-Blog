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

export function createDeleteToken(): string {
	return crypto.randomUUID();
}

export async function softDeleteComment(
	env: Env,
	id: number,
): Promise<boolean> {
	const result = await env.COMMENTS_DB.prepare(
		`UPDATE comments
		 SET content = '',
		     author_name = '已注销',
		     author_email = '',
		     author_url = NULL,
		     delete_token = NULL,
		     updated_at = ?2
		 WHERE id = ?1`,
	)
		.bind(id, Date.now())
		.run();

	return (result.meta.changes ?? 0) > 0;
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

export function nestComments(records: NormalizedComment[]) {
	const map = new Map<
		number,
		NormalizedComment & {
			replies: NormalizedComment[];
		}
	>();
	const roots: Array<
		NormalizedComment & {
			replies: NormalizedComment[];
		}
	> = [];

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

export function badRequest(message: string): Response {
	return json({ message }, 400);
}

export function unauthorized(message = "\u672a\u6388\u6743\u3002"): Response {
	return json({ message }, 401);
}

export function notFound(message = "\u8d44\u6e90\u4e0d\u5b58\u5728\u3002"): Response {
	return json({ message }, 404);
}

export function serverError(
	message = "\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\u3002",
): Response {
	return json({ message }, 500);
}

export function validateSubmission(body: Record<string, unknown>) {
	const postSlug = String(body.postSlug || "").trim();
	const postUrl = String(body.postUrl || "").trim();
	const postTitle = String(body.postTitle || "").trim();
	const name = String(body.name || "").trim();
	const email = String(body.email || "").trim();
	const url = String(body.url || "").trim();
	const content = String(body.content || "").trim();
	const parentIdRaw = String(body.parentId || "").trim();
	const parentId = parentIdRaw ? Number.parseInt(parentIdRaw, 10) : null;

	if (!postSlug) {
		return { ok: false, message: "\u7f3a\u5c11\u6587\u7ae0\u6807\u8bc6\u3002" } as const;
	}
	if (!postUrl) {
		return { ok: false, message: "\u7f3a\u5c11\u6587\u7ae0\u94fe\u63a5\u3002" } as const;
	}
	if (!name || name.length > 50) {
		return {
			ok: false,
			message: "\u6635\u79f0\u5fc5\u586b\uff0c\u4e14\u4e0d\u80fd\u8d85\u8fc7 50 \u4e2a\u5b57\u7b26\u3002",
		} as const;
	}
	if (
		!email ||
		email.length > 120 ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	) {
		return { ok: false, message: "\u8bf7\u8f93\u5165\u6709\u6548\u90ae\u7bb1\u3002" } as const;
	}
	const normalizedUrl = url
		? /^[a-z][a-z\d+\-.]*:\/\//i.test(url)
			? url
			: `https://${url}`
		: "";
	if (normalizedUrl) {
		try {
			new URL(normalizedUrl);
		} catch {
			return { ok: false, message: "\u7f51\u5740\u683c\u5f0f\u4e0d\u6b63\u786e\u3002" } as const;
		}
	}
	if (!content || content.length > 2000) {
		return {
			ok: false,
			message:
				"\u8bc4\u8bba\u5185\u5bb9\u5fc5\u586b\uff0c\u4e14\u4e0d\u80fd\u8d85\u8fc7 2000 \u4e2a\u5b57\u7b26\u3002",
		} as const;
	}
	if (parentIdRaw && (!Number.isFinite(parentId) || (parentId ?? 0) <= 0)) {
		return { ok: false, message: "\u56de\u590d\u76ee\u6807\u65e0\u6548\u3002" } as const;
	}

	return {
		ok: true,
		value: {
			postSlug,
			postUrl,
			postTitle,
			name,
			email,
			url: normalizedUrl || null,
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
	const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isFinite(id) && id > 0)));
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
