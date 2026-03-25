import type { APIContext } from "astro";
import { profileConfig, siteConfig } from "@/config";
import { getSortedPosts } from "@/utils/content-utils";
import { getPostUrl } from "@/utils/url-utils";
import { initPostIdMap } from "@/utils/permalink-utils";
import { parseMarkdown, processImagesInContent } from "@/utils/feed-utils";

export async function GET(context: APIContext) {
  if (!context.site) {
    throw Error("site not set");
  }

  const posts = (await getSortedPosts()).filter(
    (post) => !post.data.encrypted && post.data.draft !== true,
  );

  initPostIdMap(posts);

  let atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${siteConfig.title}</title>
  <subtitle>${siteConfig.subtitle || "No description"}</subtitle>
  <link href="${context.site}" rel="alternate" type="text/html"/>
  <link href="${new URL("atom.xml", context.site)}" rel="self" type="application/atom+xml"/>
  <id>${context.site}</id>
  <updated>${new Date().toISOString()}</updated>
  <language>${siteConfig.lang}</language>`;

  for (const post of posts) {
    const body = parseMarkdown(post.body);
    const content = await processImagesInContent(body, post, context);
    const postUrl = new URL(getPostUrl(post), context.site).href;

    atomFeed += `
  <entry>
    <title>${post.data.title}</title>
    <link href="${postUrl}" rel="alternate" type="text/html"/>
    <id>${postUrl}</id>
    <published>${post.data.published.toISOString()}</published>
    <updated>${post.data.updated?.toISOString() || post.data.published.toISOString()}</updated>
    <summary>${post.data.description || ""}</summary>
    <content type="html"><![CDATA[${content}]]></content>
    <author>
      <name>${profileConfig.name}</name>
    </author>`;

    if (post.data.category) {
      atomFeed += `
    <category term="${post.data.category}"></category>`;
    }

    atomFeed += `
  </entry>`;
  }

  atomFeed += `
</feed>`;

  return new Response(atomFeed, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
