export type PostLike = {
  id: string;
  data: {
    title?: string;
    published: Date | string;
    pinned?: boolean;
    priority?: number;
    prevSlug?: string;
    prevTitle?: string;
    nextSlug?: string;
    nextTitle?: string;
  };
};

export function comparePostOrder(left: PostLike, right: PostLike): number;
export function sortPosts<T extends PostLike>(posts: T[]): T[];
export function assignAdjacentPosts<T extends PostLike>(posts: T[]): T[];
