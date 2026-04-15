import { getImage } from "astro:assets";
import type { APIContext, ImageMetadata } from "astro";
import { parse as htmlParser } from "node-html-parser";
import type { CollectionEntry } from "astro:content";
import { renderFeedMarkdown, sanitizeFeedHtml } from "./feed-html";

const imagesGlob = import.meta.glob<{
  default: ImageMetadata;
}>("/src/content/**/*.{jpeg,jpg,png,gif,webp}");

function absolutizeLink(value: string, context: APIContext): string {
  return new URL(value, context.site).href;
}

export async function processImagesInContent(
  body: string,
  post: CollectionEntry<"posts">,
  context: APIContext,
): Promise<string> {
  const html = htmlParser.parse(body);
  const images = html.querySelectorAll("img");

  for (const img of images) {
    const src = img.getAttribute("src");
    if (!src) {
      continue;
    }

    if (
      src.startsWith("./") ||
      src.startsWith("../") ||
      (!src.startsWith("http") && !src.startsWith("/"))
    ) {
      let importPath: string | null = null;
      if (src.startsWith("./")) {
        const prefixRemoved = src.slice(2);
        const postPath = post.id;
        const postDir = postPath.includes("/") ? postPath.split("/")[0] : "";
        importPath = postDir
          ? `/src/content/posts/${postDir}/${prefixRemoved}`
          : `/src/content/posts/${prefixRemoved}`;
      } else if (src.startsWith("../")) {
        importPath = `/src/content/${src.replace(/^\.\.\//, "")}`;
      } else {
        const postPath = post.id;
        const postDir = postPath.includes("/") ? postPath.split("/")[0] : "";
        importPath = postDir
          ? `/src/content/posts/${postDir}/${src}`
          : `/src/content/posts/${src}`;
      }

      const imageMod = await imagesGlob[importPath]?.()?.then(
        (result) => result.default,
      );
      if (imageMod) {
        const optimizedImg = await getImage({ src: imageMod });
        img.setAttribute("src", absolutizeLink(optimizedImg.src, context));
      }
    } else if (src.startsWith("/")) {
      img.setAttribute("src", absolutizeLink(src, context));
    }
  }

  html.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
      return;
    }
    if (href.startsWith("/")) {
      anchor.setAttribute("href", absolutizeLink(href, context));
    }
  });

  return sanitizeFeedHtml(html.toString());
}

export function parseMarkdown(content: string | undefined): string {
  return renderFeedMarkdown(content);
}
