import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
loadEnv();
function parseSitemap(sitemapPath) {
    const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
    if (!urlMatches) {
        console.error("❌ No URLs found in sitemap");
        return [];
    }
    const urls = urlMatches.map((match) => {
        const url = match.replace(/<loc>|<\/loc>/g, "").trim();
        return url;
    });
    console.log(`✓ Parsed ${urls.length} URLs from sitemap`);
    return urls;
}
async function submitToIndexNow(urls) {
    if (!urls || urls.length === 0) {
        console.log("⚠ No URLs to submit");
        return;
    }
    const MAX_URLS_PER_REQUEST = 10000;
    const urlChunks = [];
    for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
        urlChunks.push(urls.slice(i, i + MAX_URLS_PER_REQUEST));
    }
    const apiKey = process.env.INDEXNOW_KEY;
    const host = process.env.INDEXNOW_HOST;
    const keyLocation = `https://${host}/${apiKey}.txt`;
    if (!apiKey || !host) {
        console.error("❌ Missing required environment variables: INDEXNOW_KEY or INDEXNOW_HOST");
        console.error("   Please configure these variables in the .env file");
        return;
    }
    for (let i = 0; i < urlChunks.length; i++) {
        const chunk = urlChunks[i];
        console.log(`\n📊 Submitting batch ${i + 1}/${urlChunks.length} URLs (${chunk.length} URLs)...`);
        try {
            const response = await fetch("https://api.indexnow.org/IndexNow", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify({
                    host: host,
                    key: apiKey,
                    keyLocation: keyLocation,
                    urlList: chunk,
                }),
            });
            if (response.status === 200) {
                console.log(`✅ Batch ${i + 1} URLs submitted successfully`);
            }
            else if (response.status === 202) {
                console.warn(`⚠ Batch ${i + 1} request accepted but still processing (Status code: ${response.status})`);
                console.warn("This is not a standard success status code, you may need to check API documentation");
            }
            else {
                console.error(`❌ Batch ${i + 1} URLs submission failed, Status code: ${response.status}`);
                const responseBody = await response.text();
                console.error(`   Response body: ${responseBody}`);
                switch (response.status) {
                    case 400:
                        console.error("   Error: Request format is invalid");
                        break;
                    case 403:
                        console.error("   Error: API key is invalid or authentication failed");
                        break;
                    case 422:
                        console.error("   Error: URL does not belong to specified host or key mismatch");
                        break;
                    case 429:
                        console.error("   Error: Request too frequent, may be considered as spam");
                        break;
                    default:
                        console.error(`   Error: Other error, status code ${response.status}`);
                }
            }
        }
        catch (error) {
            console.error(`❌ Error occurred during batch ${i + 1} URL submission:`, error.message);
        }
    }
}
async function main() {
    console.log("🚀 Starting Bing IndexNow URL submission task...\n");
    const distDir = path.join(__dirname, "../dist");
    const sitemapPath = path.join(distDir, "sitemap-0.xml");
    if (!fs.existsSync(sitemapPath)) {
        console.error(`❌ Sitemap file not found: ${sitemapPath}`);
        console.error("   Please ensure the project is built before running this script");
        process.exit(1);
    }
    try {
        const urls = parseSitemap(sitemapPath);
        if (urls.length === 0) {
            console.log("⚠ No URLs found in sitemap, skipping submission");
            return;
        }
        const host = process.env.INDEXNOW_HOST;
        const filteredUrls = urls.filter((url) => url.startsWith(`https://${host}/`) || url.startsWith(`http://${host}/`));
        console.log(`✓ Filtered to ${filteredUrls.length} valid URLs`);
        if (filteredUrls.length === 0) {
            console.log("⚠ No URLs matching the host found, skipping submission");
            return;
        }
        await submitToIndexNow(filteredUrls);
        console.log("\n🎉 Bing IndexNow URL submission task completed!");
    }
    catch (error) {
        console.error("❌ Error occurred during execution:", error.message);
        process.exit(1);
    }
}
await main();
