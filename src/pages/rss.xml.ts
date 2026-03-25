import type { RSSFeedItem } from "@astrojs/rss";
import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { siteConfig } from "@/config";
import { getSortedPosts } from "@/utils/content-utils";
import { getPostUrl } from "@/utils/url-utils";
import { initPostIdMap } from "@/utils/permalink-utils";
import { parseMarkdown, processImagesInContent } from "@/utils/feed-utils";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw Error("site not set");
  }

  const posts = (await getSortedPosts()).filter((post) => !post.data.encrypted);

  initPostIdMap(posts);

  const feed: RSSFeedItem[] = [];

  for (const post of posts) {
    const body = parseMarkdown(post.body);
    const content = await processImagesInContent(body, post, context);

    feed.push({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: getPostUrl(post),
      content,
    });
  }

  return rss({
    title: siteConfig.title,
    description: siteConfig.subtitle || "No description",
    site: context.site,
    items: feed,
    customData: `<language>${siteConfig.lang}</language>`,
  });
}
