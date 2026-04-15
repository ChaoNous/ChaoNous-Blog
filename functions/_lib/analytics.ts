import { COMMENT_MESSAGES } from "./comments-messages";

export type AnalyticsVisitPayload = {
  postSlug: string;
  postUrl: string;
  postTitle: string;
  visitorId: string;
};

const PAGE_DAILY_STATS_TABLE = "page_daily_stats";

function normalizeRequiredHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

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

function normalizeComparablePageUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return null;
  }
}

function isSafeVisitorId(value: string): boolean {
  return /^[a-z0-9-]{8,120}$/i.test(value);
}

export function validateAnalyticsPostSlug(
  value: string | null | undefined,
  requestUrl: string,
) {
  const postSlug = normalizeRequiredHttpUrl(String(value || ""));
  if (!postSlug) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidPostSlug,
    } as const;
  }

  if (new URL(postSlug).origin !== new URL(requestUrl).origin) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidPostSlug,
    } as const;
  }

  return {
    ok: true,
    value: postSlug,
  } as const;
}

export function validateAnalyticsVisit(
  body: Record<string, unknown>,
  request: Request,
) {
  const postSlug = normalizeRequiredHttpUrl(String(body.postSlug || ""));
  const postUrl = normalizeRequiredHttpUrl(String(body.postUrl || ""));
  const postTitle = String(body.postTitle || "").trim();
  const visitorId = String(body.visitorId || "").trim();

  if (!postSlug) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidPostSlug,
    } as const;
  }

  if (!postUrl) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidPostUrl,
    } as const;
  }

  if (!visitorId || !isSafeVisitorId(visitorId)) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidAnalyticsPayload,
    } as const;
  }

  if (postTitle.length > 160) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidAnalyticsPayload,
    } as const;
  }

  const requestOrigin = new URL(request.url).origin;
  if (
    new URL(postSlug).origin !== requestOrigin ||
    new URL(postUrl).origin !== requestOrigin
  ) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidOrigin,
    } as const;
  }

  const comparableSlug = normalizeComparablePageUrl(postSlug);
  const comparablePostUrl = normalizeComparablePageUrl(postUrl);
  const referer = request.headers.get("referer")?.trim();
  const comparableReferer = referer
    ? normalizeComparablePageUrl(referer)
    : null;

  if (
    !comparableSlug ||
    !comparablePostUrl ||
    comparableSlug !== comparablePostUrl ||
    !comparableReferer ||
    comparableReferer !== comparablePostUrl
  ) {
    return {
      ok: false,
      message: COMMENT_MESSAGES.invalidOrigin,
    } as const;
  }

  return {
    ok: true,
    value: {
      postSlug,
      postUrl,
      postTitle,
      visitorId,
    } satisfies AnalyticsVisitPayload,
  } as const;
}

export function buildAnalyticsDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function buildRecentDayKeys(
  count: number,
  endTimestamp: number = Date.now(),
): string[] {
  const days: string[] = [];
  const endDate = new Date(endTimestamp);
  endDate.setUTCHours(0, 0, 0, 0);

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const current = new Date(endDate);
    current.setUTCDate(endDate.getUTCDate() - offset);
    days.push(buildAnalyticsDayKey(current.getTime()));
  }

  return days;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return String(error || "");
}

export function isMissingPageDailyStatsTableError(error: unknown): boolean {
  return getErrorMessage(error)
    .toLowerCase()
    .includes(`no such table: ${PAGE_DAILY_STATS_TABLE}`);
}
