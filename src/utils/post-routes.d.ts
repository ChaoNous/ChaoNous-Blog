export type PostRouteLike = {
  id: string;
  data?: {
    alias?: string;
    permalink?: string;
  };
};

export function getDefaultPostSlug(id: string): string;
export function getAliasPostSlug(alias?: string): string;
export function getPermalinkPostSlug(permalink?: string): string;
export function getCanonicalPostSlug(post: PostRouteLike): string;
export function getAllPostSlugs(post: PostRouteLike): string[];
