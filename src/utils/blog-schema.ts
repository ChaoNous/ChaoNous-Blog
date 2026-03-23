import { formatDateToYYYYMMDD } from "./date-utils";

type BlogPostingSchemaInput = {
	title: string;
	description?: string;
	published: Date;
	lang?: string;
	authorName: string;
	siteUrl: string | URL | undefined;
	defaultLang: string;
};

export function buildBlogPostingJsonLd({
	title,
	description,
	published,
	lang,
	authorName,
	siteUrl,
	defaultLang,
}: BlogPostingSchemaInput) {
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: title,
		description: description || title,
		author: {
			"@type": "Person",
			name: authorName,
			url: siteUrl,
		},
		datePublished: formatDateToYYYYMMDD(published),
		inLanguage: (lang || defaultLang).replace("_", "-"),
	};
}
