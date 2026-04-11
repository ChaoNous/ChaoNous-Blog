import type { NestedComment, NormalizedComment } from "./comments-types";

export function compareCommentOrder(
  left: NormalizedComment,
  right: NormalizedComment,
): number;
export function buildNestedComments(
  records: NormalizedComment[],
): NestedComment[];
export function paginateNestedComments(
  records: NormalizedComment[],
  page?: number,
  limit?: number,
): { data: NestedComment[]; totalCount: number };
