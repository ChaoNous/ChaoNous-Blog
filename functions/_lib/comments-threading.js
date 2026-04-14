function toTimestamp(value) {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}
export function compareCommentOrder(left, right) {
    const timestampDiff = toTimestamp(left.createdAt) - toTimestamp(right.createdAt);
    if (timestampDiff !== 0) {
        return timestampDiff;
    }
    return left.id - right.id;
}
export function buildNestedComments(records) {
    const map = new Map();
    const roots = [];
    const ordered = [...records].sort(compareCommentOrder);
    for (const record of ordered) {
        map.set(record.id, {
            ...record,
            replies: [],
        });
    }
    for (const record of map.values()) {
        if (record.parentId && map.has(record.parentId)) {
            map.get(record.parentId).replies.push(record);
            continue;
        }
        roots.push(record);
    }
    return roots;
}
export function paginateNestedComments(records, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const roots = buildNestedComments(records);
    const offset = (safePage - 1) * safeLimit;
    return {
        data: roots.slice(offset, offset + safeLimit),
        totalCount: roots.length,
    };
}
