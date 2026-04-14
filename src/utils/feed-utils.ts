import { getImage } from "astro:assets";
import type { APIContext, ImageMetadata } from "astro";
import MarkdownIt from "markdown-it";
import { parse as htmlParser } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import type { CollectionEntry } from "astro:content";
const markdownParser = new MarkdownIt();
const imagesGlob = import.meta.glob<{
    default: ImageMetadata;
}>("/src/content/**/*.{jpeg,jpg,png,gif,webp}");
export async function processImagesInContent(body: string, post: CollectionEntry<"posts">, context: APIContext): Promise<string> {
    const html = htmlParser.parse(body);
    const images = html.querySelectorAll("img");
    for (const img of images) {
        const src = img.getAttribute("src");
        if (!src)
            continue;
        if (src.startsWith("./") ||
            src.startsWith("../") ||
            (!src.startsWith("http") && !src.startsWith("/"))) {
            let importPath: string | null = null;
            if (src.startsWith("./")) {
                const prefixRemoved = src.slice(2);
                const postPath = post.id;
                const postDir = postPath.includes("/") ? postPath.split("/")[0] : "";
                if (postDir) {
                    importPath = `/src/content/posts/${postDir}/${prefixRemoved}`;
                }
                else {
                    importPath = `/src/content/posts/${prefixRemoved}`;
                }
            }
            else if (src.startsWith("../")) {
                const cleaned = src.replace(/^\.\.\//, "");
                importPath = `/src/content/${cleaned}`;
            }
            else {
                const postPath = post.id;
                const postDir = postPath.includes("/") ? postPath.split("/")[0] : "";
                if (postDir) {
                    importPath = `/src/content/posts/${postDir}/${src}`;
                }
                else {
                    importPath = `/src/content/posts/${src}`;
                }
            }
            const imageMod = await imagesGlob[importPath]?.()?.then((res) => res.default);
            if (imageMod) {
                const optimizedImg = await getImage({ src: imageMod });
                img.setAttribute("src", new URL(optimizedImg.src, context.site).href);
            }
        }
        else if (src.startsWith("/")) {
            img.setAttribute("src", new URL(src, context.site).href);
        }
    }
    return sanitizeHtml(html.toString(), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    });
}
export function parseMarkdown(content: string | undefined): string {
    return markdownParser.render(String(content ?? ""));
}
