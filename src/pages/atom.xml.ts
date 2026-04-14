import type { APIContext } from "astro";
import { profileConfig, siteConfig } from "@/config";
import { getSortedPosts } from "@/utils/content-utils";
import { parseMarkdown, processImagesInContent } from "@/utils/feed-utils";
import { getPostUrl } from "@/utils/url-utils";
import {
  escapeXmlAttribute,
  escapeXmlText,
  wrapInCdata,
} from "@/utils/xml-utils";

export async function GET(context: APIContext): Promise<Response> {
  if (!context.site) {
    throw Error("site not set");
  }

  const siteUrl = String(context.site);
  const selfUrl = new URL("atom.xml", context.site).toString();
  const posts = (await getSortedPosts()).filter(
    (post) => !(post.data as any).encrypted && post.data.draft !== true,
  );

  let atomFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXmlText(siteConfig.title)}</title>
  <subtitle>${escapeXmlText(siteConfig.subtitle || "No description")}</subtitle>
  <link href="${escapeXmlAttribute(siteUrl)}" rel="alternate" type="text/html"/>
  <link href="${escapeXmlAttribute(selfUrl)}" rel="self" type="application/atom+xml"/>
  <id>${escapeXmlText(siteUrl)}</id>
  <updated>${new Date().toISOString()}</updated>
  <language>${escapeXmlText(siteConfig.lang)}</language>`;

  for (const post of posts) {
    const body = parseMarkdown(post.body);
    const content = await processImagesInContent(body, post, context);
    const postUrl = new URL(getPostUrl(post), context.site).href;
    const summary = post.data.description || "";

    atomFeed += `
  <entry>
    <title>${escapeXmlText(post.data.title)}</title>
    <link href="${escapeXmlAttribute(postUrl)}" rel="alternate" type="text/html"/>
    <id>${escapeXmlText(postUrl)}</id>
    <published>${post.data.published.toISOString()}</published>
    <updated>${post.data.updated?.toISOString() || post.data.published.toISOString()}</updated>
    <summary>${escapeXmlText(summary)}</summary>
    <content type="html"><![CDATA[${wrapInCdata(content)}]]></content>
    <author>
      <name>${escapeXmlText(profileConfig.name)}</name>
    </author>`;

    if (post.data.category) {
      atomFeed += `
    <category term="${escapeXmlAttribute(post.data.category)}"></category>`;
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
