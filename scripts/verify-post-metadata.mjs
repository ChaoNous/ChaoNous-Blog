import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadPostMetadata,
  validateLoadedPostMetadata,
} from "./lib/post-metadata.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const postsDirectory = path.resolve(scriptDirectory, "../src/content/posts");

const posts = await loadPostMetadata(postsDirectory);
const result = validateLoadedPostMetadata(posts);

if (result.errors.length > 0) {
  console.error("Post metadata verification failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Verified ${posts.length} post files and ${result.routeCount} post routes.`,
);
