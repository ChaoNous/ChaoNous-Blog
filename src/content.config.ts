import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
    schema: z.object({
        title: z.string().trim(),
        published: z.date(),
        updated: z.date().optional(),
        draft: z.boolean().optional().default(false),
        description: z.string().trim().optional().default(""),
        image: z.string().trim().optional().default(""),
        tags: z.array(z.string().trim()).optional().default([]),
        category: z.string().trim().optional().nullable().default(""),
        lang: z.string().trim().optional().default(""),
        pinned: z.boolean().optional().default(false),
        priority: z.number().optional(),
        author: z.string().trim().optional().default(""),
        sourceLink: z.string().trim().optional().default(""),
        licenseName: z.string().trim().optional().default(""),
        licenseUrl: z.string().trim().optional().default(""),
        alias: z.string().trim().optional(),
        permalink: z.string().trim().optional(),
        prevTitle: z.string().trim().default(""),
        prevSlug: z.string().trim().default(""),
        nextTitle: z.string().trim().default(""),
        nextSlug: z.string().trim().default(""),
    }),
});

export const collections = {
    posts: postsCollection,
};
