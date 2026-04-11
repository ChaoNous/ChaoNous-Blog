export const COMMENT_SUBMISSION_POLICY = {
  minSubmitIntervalMs: 30 * 1000,
  recentPostWindowMs: 10 * 60 * 1000,
  recentGlobalWindowMs: 60 * 60 * 1000,
  duplicateWindowMs: 12 * 60 * 60 * 1000,
  minFormFillMs: 3 * 1000,
  maxLinksPerComment: 3,
  maxRecentPerPost: 3,
  maxRecentPerEmail: 6,
  anonymousRecentPostWindowMs: 10 * 60 * 1000,
  anonymousRecentGlobalWindowMs: 60 * 60 * 1000,
  maxRecentPerFingerprintPerPost: 4,
  maxRecentPerFingerprintGlobal: 10,
};

const anonymousSubmissionStore = new Map();

export function countUrlsInText(value) {
  const matches = value.match(
    /\b(?:https?:\/\/|www\.)[^\s<>"']+/giu,
  );
  return matches ? matches.length : 0;
}

export function parseFormLoadedAt(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function evaluateSubmissionContentPolicy({
  website = "",
  content = "",
  formLoadedAt = null,
  now = Date.now(),
  policy = COMMENT_SUBMISSION_POLICY,
}) {
  if (String(website || "").trim()) {
    return { ok: false, reason: "honeypot" };
  }

  const linksCount = countUrlsInText(content);
  if (linksCount > policy.maxLinksPerComment) {
    return { ok: false, reason: "too_many_links", linksCount };
  }

  if (formLoadedAt && now - formLoadedAt < policy.minFormFillMs) {
    return { ok: false, reason: "submitted_too_fast" };
  }

  return { ok: true };
}

export function evaluateSubmissionRateLimit({
  now = Date.now(),
  recentPostCount = 0,
  recentGlobalCount = 0,
  lastPostCreatedAt = null,
  lastDuplicateCreatedAt = null,
  policy = COMMENT_SUBMISSION_POLICY,
}) {
  if (
    Number.isFinite(lastDuplicateCreatedAt) &&
    now - Number(lastDuplicateCreatedAt) <= policy.duplicateWindowMs
  ) {
    return { ok: false, reason: "duplicate_content" };
  }

  if (
    Number.isFinite(lastPostCreatedAt) &&
    now - Number(lastPostCreatedAt) < policy.minSubmitIntervalMs
  ) {
    return { ok: false, reason: "rate_limited" };
  }

  if (recentPostCount >= policy.maxRecentPerPost) {
    return { ok: false, reason: "rate_limited" };
  }

  if (recentGlobalCount >= policy.maxRecentPerEmail) {
    return { ok: false, reason: "rate_limited" };
  }

  return { ok: true };
}

function pruneTimestamps(timestamps, minTimestamp) {
  return timestamps.filter((timestamp) => timestamp >= minTimestamp);
}

function getClientIp(request) {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  if (!forwardedFor) return "";
  return forwardedFor.split(",")[0]?.trim() || "";
}

export function getRequestFingerprint(request) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent")?.trim() || "";
  const acceptLanguage =
    request.headers.get("accept-language")?.trim().slice(0, 64) || "";

  if (!ip && !userAgent) {
    return null;
  }

  return `${ip}|${userAgent.slice(0, 160)}|${acceptLanguage}`;
}

export function resetAnonymousSubmissionThrottle() {
  anonymousSubmissionStore.clear();
}

export function enforceAnonymousSubmissionThrottle({
  request,
  postSlug,
  now = Date.now(),
  policy = COMMENT_SUBMISSION_POLICY,
}) {
  const fingerprint = getRequestFingerprint(request);
  if (!fingerprint) {
    return { ok: true };
  }

  const globalKey = `global:${fingerprint}`;
  const postKey = `post:${postSlug}:${fingerprint}`;

  const nextGlobalTimestamps = pruneTimestamps(
    anonymousSubmissionStore.get(globalKey) || [],
    now - policy.anonymousRecentGlobalWindowMs,
  );
  const nextPostTimestamps = pruneTimestamps(
    anonymousSubmissionStore.get(postKey) || [],
    now - policy.anonymousRecentPostWindowMs,
  );

  if (nextPostTimestamps.length >= policy.maxRecentPerFingerprintPerPost) {
    anonymousSubmissionStore.set(globalKey, nextGlobalTimestamps);
    anonymousSubmissionStore.set(postKey, nextPostTimestamps);
    return { ok: false, reason: "anonymous_rate_limited" };
  }

  if (nextGlobalTimestamps.length >= policy.maxRecentPerFingerprintGlobal) {
    anonymousSubmissionStore.set(globalKey, nextGlobalTimestamps);
    anonymousSubmissionStore.set(postKey, nextPostTimestamps);
    return { ok: false, reason: "anonymous_rate_limited" };
  }

  nextGlobalTimestamps.push(now);
  nextPostTimestamps.push(now);
  anonymousSubmissionStore.set(globalKey, nextGlobalTimestamps);
  anonymousSubmissionStore.set(postKey, nextPostTimestamps);

  return { ok: true };
}
