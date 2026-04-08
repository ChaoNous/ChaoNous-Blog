import type { Env } from "./comments-types";

const ADMIN_SESSION_COOKIE = "cnc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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

async function deleteExpiredAdminSessions(env: Env): Promise<void> {
  await env.COMMENTS_DB.prepare(
    `DELETE FROM admin_sessions
     WHERE expires_at <= ?1`,
  )
    .bind(Date.now())
    .run();
}

export function getAdminSessionToken(request: Request): string {
  return parseCookies(request).get(ADMIN_SESSION_COOKIE)?.trim() || "";
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
