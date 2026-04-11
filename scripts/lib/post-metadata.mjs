import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  getAliasPostSlug,
  getAllPostSlugs,
  getPermalinkPostSlug,
} from "../../src/utils/post-routes.js";

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx", ".markdown"]);
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---/;

async function walkMarkdownFiles(directoryPath) {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(fullPath)));
      continue;
    }

    if (MARKDOWN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

export function parseFrontmatter(content) {
  const match = content.match(FRONTMATTER_PATTERN);
  return match?.[1] || "";
}

export function parseFrontmatterScalar(frontmatter, key) {
  const pattern = new RegExp(`^${key}:\\s*(.+)$`, "m");
  const match = frontmatter.match(pattern);
  if (!match) {
    return "";
  }

  const rawValue = match[1].trim();
  if (!rawValue || rawValue === "null") {
    return "";
  }

  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1).trim();
  }

  return rawValue;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function validateLoadedPostMetadata(posts) {
  const errors = [];
  const routeOwners = new Map();

  for (const post of posts) {
    const aliasSlug = getAliasPostSlug(post.alias);
    const permalinkSlug = getPermalinkPostSlug(post.permalink);

    if (post.alias && !aliasSlug) {
      errors.push(
        `${post.relativePath}: alias resolves to an empty route slug.`,
      );
    }

    if (post.permalink && !permalinkSlug) {
      errors.push(
        `${post.relativePath}: permalink resolves to an empty route slug.`,
      );
    }

    for (const slug of post.routeSlugs) {
      const owner = routeOwners.get(slug);
      if (owner && owner !== post.relativePath) {
        errors.push(
          `${post.relativePath}: route slug "${slug}" conflicts with ${owner}.`,
        );
        continue;
      }

      routeOwners.set(slug, post.relativePath);
    }

    if (post.localImagePath && !post.localImageExists) {
      errors.push(
        `${post.relativePath}: image "${post.image}" does not exist at ${post.localImagePath}.`,
      );
    }
  }

  return {
    errors,
    routeCount: routeOwners.size,
  };
}

export async function loadPostMetadata(postsDir) {
  const markdownFiles = await walkMarkdownFiles(postsDir);
  const posts = [];

  for (const filePath of markdownFiles) {
    const content = await readFile(filePath, "utf8");
    const frontmatter = parseFrontmatter(content);
    const relativePath = path.relative(postsDir, filePath).replaceAll("\\", "/");
    const id = relativePath.replace(/\.(md|mdx|markdown)$/i, "");
    const alias = parseFrontmatterScalar(frontmatter, "alias");
    const permalink = parseFrontmatterScalar(frontmatter, "permalink");
    const image = parseFrontmatterScalar(frontmatter, "image");
    const localImagePath =
      image && !/^https?:\/\//i.test(image) && !image.startsWith("/")
        ? path.resolve(path.dirname(filePath), image)
        : null;

    posts.push({
      id,
      relativePath,
      alias,
      permalink,
      image,
      localImagePath,
      localImageExists: localImagePath ? await fileExists(localImagePath) : true,
      routeSlugs: getAllPostSlugs({
        id,
        data: {
          alias,
          permalink,
        },
      }),
    });
  }

  return posts;
}
