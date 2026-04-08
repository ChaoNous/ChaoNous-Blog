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
