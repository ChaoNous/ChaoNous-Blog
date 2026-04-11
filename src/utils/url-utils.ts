import type { CollectionEntry } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCanonicalPostSlug } from "@utils/post-routes.js";

export function removeFileExtension(id: string): string {
  return id.replace(/\.(md|mdx|markdown)$/i, "");
}

export function pathsEqual(path1: string, path2: string): boolean {
  const normalizedPath1 = path1.replace(/^\/|\/$/g, "").toLowerCase();
  const normalizedPath2 = path2.replace(/^\/|\/$/g, "").toLowerCase();
  return normalizedPath1 === normalizedPath2;
}

function joinUrl(...parts: string[]): string {
  const joined = parts.join("/");
  return joined.replace(/\/+/g, "/");
}

export function getPostUrlBySlug(slug: string): string {
  const slugWithoutExt = removeFileExtension(slug);
  return url(`/posts/${slugWithoutExt}/`);
}

export function getPostUrl(post: CollectionEntry<"posts">): string;
export function getPostUrl(post: {
  id: string;
  data: { alias?: string; permalink?: string };
}): string;
export function getPostUrl(post: any): string {
  const canonicalSlug = getCanonicalPostSlug(post);
  return getPostUrlBySlug(canonicalSlug);
}

export function getCategoryUrl(category: string | null): string {
  if (
    !category ||
    category.trim() === "" ||
    category.trim().toLowerCase() === i18n(I18nKey.uncategorized).toLowerCase()
  ) {
    return url("/archive/?uncategorized=true");
  }

  return url(`/archive/?category=${encodeURIComponent(category.trim())}`);
}

export function getFileDirFromPath(filePath: string): string {
  return filePath.replace(/^src\//, "").replace(/\/[^/]+$/, "");
}

export function url(path: string): string {
  return joinUrl("", import.meta.env.BASE_URL, path);
}
