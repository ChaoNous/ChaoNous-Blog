export declare const COMMENT_SUBMISSION_POLICY: {
  minSubmitIntervalMs: number;
  recentPostWindowMs: number;
  recentGlobalWindowMs: number;
  duplicateWindowMs: number;
  minFormFillMs: number;
  maxLinksPerComment: number;
  maxRecentPerPost: number;
  maxRecentPerEmail: number;
};

export declare function countUrlsInText(value: string): number;

export declare function parseFormLoadedAt(value: unknown): number | null;

export declare function evaluateSubmissionContentPolicy(input: {
  website?: string;
  content?: string;
  formLoadedAt?: number | null;
  now?: number;
  policy?: typeof COMMENT_SUBMISSION_POLICY;
}):
  | { ok: true }
  | {
      ok: false;
      reason: "honeypot" | "submitted_too_fast";
    }
  | {
      ok: false;
      reason: "too_many_links";
      linksCount: number;
    };

export declare function evaluateSubmissionRateLimit(input: {
  now?: number;
  recentPostCount?: number;
  recentGlobalCount?: number;
  lastPostCreatedAt?: number | null;
  lastDuplicateCreatedAt?: number | null;
  policy?: typeof COMMENT_SUBMISSION_POLICY;
}):
  | { ok: true }
  | {
      ok: false;
      reason: "duplicate_content" | "rate_limited";
    };
