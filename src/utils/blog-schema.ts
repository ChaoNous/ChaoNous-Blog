import { formatDateToYYYYMMDD } from "./date-utils";
type BlogPostingSchemaInput = {
    title: string;
    description?: string;
    published: Date;
    updated?: Date;
    lang?: string;
    authorName: string;
    siteUrl: string | URL | undefined;
    pageUrl?: string | URL;
    imageUrl?: string;
    wordCount?: number;
    tags?: string[];
    category?: string;
    defaultLang: string;
};
export function buildBlogPostingJsonLd({ title, description, published, updated, lang, authorName, siteUrl, pageUrl, imageUrl, wordCount, tags, category, defaultLang, }: BlogPostingSchemaInput): Record<string, unknown> {
    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: description || title,
        author: {
            "@type": "Person",
            name: authorName,
            url: siteUrl ? String(siteUrl) : undefined,
        },
        datePublished: formatDateToYYYYMMDD(published),
        inLanguage: (lang || defaultLang).replace("_", "-"),
    };
    if (pageUrl) {
        schema.url = String(pageUrl);
        schema.mainEntityOfPage = {
            "@type": "WebPage",
            "@id": String(pageUrl),
        };
    }
    if (imageUrl) {
        schema.image = {
            "@type": "ImageObject",
            url: imageUrl,
        };
    }
    if (updated) {
        schema.dateModified = formatDateToYYYYMMDD(updated);
    }
    else {
        schema.dateModified = formatDateToYYYYMMDD(published);
    }
    if (typeof wordCount === "number" && wordCount > 0) {
        schema.wordCount = wordCount;
    }
    if (tags && tags.length > 0) {
        schema.keywords = tags.join(", ");
    }
    if (category) {
        schema.articleSection = category;
    }
    return schema;
}
