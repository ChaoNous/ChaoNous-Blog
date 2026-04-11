export const COMMENT_SUBMISSION_POLICY = {
  minSubmitIntervalMs: 30 * 1000,
  recentPostWindowMs: 10 * 60 * 1000,
  recentGlobalWindowMs: 60 * 60 * 1000,
  duplicateWindowMs: 12 * 60 * 60 * 1000,
  minFormFillMs: 3 * 1000,
  maxLinksPerComment: 3,
  maxRecentPerPost: 3,
  maxRecentPerEmail: 6,
};

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
