import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl, getPostUrl } from "@utils/url-utils";
import { assignAdjacentPosts, sortPosts } from "./post-sort.js";

// Retrieve posts and sort them by pinned state, priority, and publish date.
async function getRawSortedPosts(): Promise<CollectionEntry<"posts">[]> {
  const allBlogPosts = await getCollection("posts", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });

  return sortPosts(allBlogPosts);
}

export async function getSortedPosts(): Promise<CollectionEntry<"posts">[]> {
  return assignAdjacentPosts(await getRawSortedPosts());
}

export type PostForList = {
  id: string;
  data: CollectionEntry<"posts">["data"];
  url?: string;
};

export async function getSortedPostsList(): Promise<PostForList[]> {
  const sortedFullPosts = await getRawSortedPosts();

  return sortedFullPosts.map((post) => ({
    id: post.id,
    data: post.data,
    url: getPostUrl(post),
  }));
}

export type Category = {
  name: string;
  count: number;
  url: string;
};

export async function getCategoryList(): Promise<Category[]> {
  const allBlogPosts = await getCollection<"posts">("posts", ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  });
  const count: { [key: string]: number } = {};

  allBlogPosts.forEach((post: { data: { category: string | null } }) => {
    if (!post.data.category) {
      const uncategorizedKey = i18n(I18nKey.uncategorized);
      count[uncategorizedKey] = count[uncategorizedKey]
        ? count[uncategorizedKey] + 1
        : 1;
      return;
    }

    const categoryName =
      typeof post.data.category === "string"
        ? post.data.category.trim()
        : String(post.data.category).trim();

    count[categoryName] = count[categoryName]
      ? count[categoryName] + 1
      : 1;
  });

  return Object.keys(count)
    .sort((left, right) =>
      left.toLowerCase().localeCompare(right.toLowerCase()),
    )
    .map((categoryName) => ({
      name: categoryName,
      count: count[categoryName],
      url: getCategoryUrl(categoryName),
    }));
}
