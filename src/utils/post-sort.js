function toTimestamp(value) {
    if (value instanceof Date) {
        return value.getTime();
    }
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}
export function comparePostOrder(left, right) {
    if (left.data.pinned && !right.data.pinned)
        return -1;
    if (!left.data.pinned && right.data.pinned)
        return 1;
    if (left.data.pinned && right.data.pinned) {
        const leftPriority = left.data.priority;
        const rightPriority = right.data.priority;
        if (leftPriority !== undefined && rightPriority !== undefined) {
            if (leftPriority !== rightPriority) {
                return leftPriority - rightPriority;
            }
        }
        else if (leftPriority !== undefined) {
            return -1;
        }
        else if (rightPriority !== undefined) {
            return 1;
        }
    }
    const timestampDiff = toTimestamp(right.data.published) - toTimestamp(left.data.published);
    if (timestampDiff !== 0) {
        return timestampDiff;
    }
    return 0;
}
export function sortPosts(posts) {
    return [...posts].sort(comparePostOrder);
}
export function assignAdjacentPosts(posts) {
    for (let index = 0; index < posts.length; index += 1) {
        const current = posts[index];
        const previous = posts[index + 1];
        const next = posts[index - 1];
        current.data.prevSlug = previous?.id || "";
        current.data.prevTitle = previous?.data.title || "";
        current.data.nextSlug = next?.id || "";
        current.data.nextTitle = next?.data.title || "";
    }
    return posts;
}
