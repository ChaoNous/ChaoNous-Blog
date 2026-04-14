const MARKDOWN_EXTENSION_PATTERN = /\.(md|mdx|markdown)$/i;
function trimRouteSlashes(value) {
    return String(value || "")
        .trim()
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");
}
function normalizePostScopedSlug(value) {
    const normalized = trimRouteSlashes(value);
    return normalized.replace(/^posts\//, "");
}
export function getDefaultPostSlug(id) {
    return String(id || "").replace(MARKDOWN_EXTENSION_PATTERN, "");
}
export function getAliasPostSlug(alias) {
    return normalizePostScopedSlug(alias);
}
export function getPermalinkPostSlug(permalink) {
    return normalizePostScopedSlug(permalink);
}
export function getCanonicalPostSlug(post) {
    return (getPermalinkPostSlug(post?.data?.permalink) ||
        getAliasPostSlug(post?.data?.alias) ||
        getDefaultPostSlug(post?.id));
}
export function getAllPostSlugs(post) {
    const candidates = [
        getDefaultPostSlug(post?.id),
        getAliasPostSlug(post?.data?.alias),
        getPermalinkPostSlug(post?.data?.permalink),
    ];
    return candidates.filter((slug, index) => Boolean(slug) && candidates.indexOf(slug) === index);
}
