import { formatDateToYYYYMMDD } from "./date-utils";

type BlogPostingSchemaInput = {
  title: string;
  description?: string;
  published: Date;
  updated?: Date;
  lang?: string;
  authorName: string;
  siteUrl: string | URL | undefined;
  /** 文章规范 URL */
  pageUrl?: string | URL;
  /** 封面图绝对 URL */
  imageUrl?: string;
  /** 字数统计（由 remark 插件提供） */
  wordCount?: number;
  /** 文章标签 */
  tags?: string[];
  /** 文章分类 */
  category?: string;
  defaultLang: string;
};

export function buildBlogPostingJsonLd({
  title,
  description,
  published,
  updated,
  lang,
  authorName,
  siteUrl,
  pageUrl,
  imageUrl,
  wordCount,
  tags,
  category,
  defaultLang,
}: BlogPostingSchemaInput): Record<string, unknown> {
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

  // 文章规范 URL
  if (pageUrl) {
    schema.url = String(pageUrl);
    schema.mainEntityOfPage = {
      "@type": "WebPage",
      "@id": String(pageUrl),
    };
  }

  // 封面图
  if (imageUrl) {
    schema.image = {
      "@type": "ImageObject",
      url: imageUrl,
    };
  }

  // 最后修改时间
  if (updated) {
    schema.dateModified = formatDateToYYYYMMDD(updated);
  } else {
    // 没有 updated 字段时回退为 datePublished
    schema.dateModified = formatDateToYYYYMMDD(published);
  }

  // 字数
  if (typeof wordCount === "number" && wordCount > 0) {
    schema.wordCount = wordCount;
  }

  // 标签 → keywords
  if (tags && tags.length > 0) {
    schema.keywords = tags.join(", ");
  }

  // 分类
  if (category) {
    schema.articleSection = category;
  }

  return schema;
}
