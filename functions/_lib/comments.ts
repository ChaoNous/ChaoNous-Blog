interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	all<T>(): Promise<{ results: T[] }>;
	first<T>(): Promise<T | null>;
	run(): Promise<{ meta: { last_row_id?: number } }>;
}

interface D1Database {
	prepare(query: string): D1PreparedStatement;
}

export interface Env {
	COMMENTS_DB: D1Database;
	COMMENT_REQUIRE_MODERATION?: string;
	COMMENT_ADMIN_PASSWORD?: string;
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
	status: string;
	created_at: number;
	updated_at: number;
}

export function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}

export function requireModeration(env: Env): boolean {
	return env.COMMENT_REQUIRE_MODERATION !== "false";
}

export function getAdminPassword(request: Request): string {
	return request.headers.get("x-comment-admin-password")?.trim() || "";
}

export function isAdminAuthorized(request: Request, env: Env): boolean {
	const expected = env.COMMENT_ADMIN_PASSWORD?.trim();
	if (!expected) return false;
	return getAdminPassword(request) === expected;
}

export function toIso(timestamp: number): string {
	return new Date(timestamp).toISOString();
}

export function normalizeComment(record: CommentRecord) {
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

export function nestComments(records: ReturnType<typeof normalizeComment>[]) {
	const map = new Map<
		number,
		ReturnType<typeof normalizeComment> & {
			replies: ReturnType<typeof normalizeComment>[];
		}
	>();
	const roots: Array<
		ReturnType<typeof normalizeComment> & {
			replies: ReturnType<typeof normalizeComment>[];
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

export function unauthorized(message = "未授权。"): Response {
	return json({ message }, 401);
}

export function serverError(message = "服务暂时不可用。"): Response {
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

	if (!postSlug) return { ok: false, message: "缺少文章标识。" } as const;
	if (!postUrl) return { ok: false, message: "缺少文章链接。" } as const;
	if (!name || name.length > 50) {
		return { ok: false, message: "昵称必填，且不能超过 50 个字符。" } as const;
	}
	if (
		!email ||
		email.length > 120 ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	) {
		return { ok: false, message: "请输入有效邮箱。" } as const;
	}
	if (url) {
		try {
			new URL(url);
		} catch {
			return { ok: false, message: "网址格式不正确。" } as const;
		}
	}
	if (!content || content.length > 2000) {
		return {
			ok: false,
			message: "评论内容必填，且不能超过 2000 个字符。",
		} as const;
	}
	if (parentIdRaw && (!Number.isFinite(parentId) || (parentId ?? 0) <= 0)) {
		return { ok: false, message: "回复目标无效。" } as const;
	}

	return {
		ok: true,
		value: {
			postSlug,
			postUrl,
			postTitle,
			name,
			email,
			url: url || null,
			content,
			parentId,
		},
	} as const;
}
