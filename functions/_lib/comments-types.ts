export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { last_row_id?: number; changes?: number } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Env {
  COMMENTS_DB: D1Database;
}

export type CommentSubmissionEventRecord = {
  id: number;
  fingerprint_hash: string;
  post_slug: string;
  created_at: number;
};

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
  | "TOO_MANY_REQUESTS"
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
