import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const outputDir = 'E:/ChaoNous-Blog/comment-check-screenshots';
if (!existsSync(outputDir)) mkdirSync(outputDir);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Step 1: Navigate to the blog
console.log('Navigating to chaonous.com...');
await page.goto('https://chaonous.com', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${outputDir}/00-homepage.png`, fullPage: false });
console.log('Screenshot: homepage taken');

// Step 2: Find a blog post link and click it
console.log('Looking for a blog post link...');

// Try to find any post link on the homepage
const postSelectors = [
  'article a',
  '.post a',
  'a[href*="/post/"]',
  'a[href*="/blog/"]',
  '.entry-title a',
  '.post-title a',
  'a.post-link',
  '.post-card a',
  '.card a',
];

let clicked = false;
for (const selector of postSelectors) {
  const el = await page.$(selector);
  if (el) {
    const href = await el.getAttribute('href');
    console.log(`  Found post link: href="${href}", selector="${selector}"`);
    await el.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    clicked = true;
    break;
  }
}

if (!clicked) {
  console.log('No post link found on homepage. Trying /posts/...');
  await page.goto('https://chaonous.com/posts', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outputDir}/00-posts-page.png`, fullPage: false });

  for (const selector of postSelectors) {
    const el = await page.$(selector);
    if (el) {
      const href = await el.getAttribute('href');
      console.log(`  Found post link: href="${href}", selector="${selector}"`);
      await el.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
      clicked = true;
      break;
    }
  }
}

if (!clicked) {
  console.log('ERROR: Could not find any blog post link');
  await browser.close();
  process.exit(1);
}

await page.waitForTimeout(2000);
await page.screenshot({ path: `${outputDir}/01-post-page.png`, fullPage: false });
console.log('Screenshot: post page taken');

// Step 3: Scroll down looking for the comment section
// Look for common Twikoo selectors
const commentSelectors = [
  '#twikoo',
  '.twikoo',
  '#comment',
  '#comments',
  '.comment',
  '.comments',
  '#twikoo-comments',
  '#twikoo-container',
];

let scrolledToComment = false;
for (const selector of commentSelectors) {
  const el = await page.$(selector);
  if (el) {
    console.log(`Found comment section: selector="${selector}"`);
    await el.scrollIntoViewIfNeeded();
    scrolledToComment = true;
    break;
  }
}

if (!scrolledToComment) {
  console.log('Did not find a comment section on this post. Scrolling to bottom...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outputDir}/02-bottom-of-post.png`, fullPage: false });
}

// Step 4: Wait a FULL 10 seconds for everything to load and settle
console.log('Waiting 10 seconds for Twikoo to fully load...');
await page.waitForTimeout(10000);

// Take a full viewport screenshot first
await page.screenshot({ path: `${outputDir}/03-comment-full-viewport.png`, fullPage: false });
console.log('Screenshot: full viewport after 10s wait');

// Step 5: Find the Twikoo container and take a close-up
let twikooEl = null;
for (const selector of ['#twikoo', '.twikoo', '#comment', '#comments', '.comment', '.comments']) {
  const el = await page.$(selector);
  if (el) {
    twikooEl = el;
    console.log(`Taking closeup of: ${selector}`);
    break;
  }
}

if (twikooEl) {
  await twikooEl.screenshot({ path: `${outputDir}/04-comment-closeup.png` });
  console.log('Screenshot: comment closeup taken');
} else {
  console.log('No Twikoo element found at all. Taking full page screenshot.');
  await page.screenshot({ path: `${outputDir}/04-full-page.png`, fullPage: true });
}

// Step 6: Additional close-up focusing specifically on the comment input area and submit button
// Scroll to the comment input area
await page.waitForTimeout(2000);

const inputAreaSelectors = [
  '.tk-input textarea',
  '#twikoo .tk-input textarea',
  '#twikoo textarea',
  '.twikoo textarea',
  '.tk-submit',
  '#twikoo .tk-submit',
];

for (const sel of inputAreaSelectors) {
  const el = await page.$(sel);
  if (el) {
    console.log(`Found input area: ${sel}`);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${outputDir}/05-comment-input-closeup.png`, fullPage: false });
    await el.screenshot({ path: `${outputDir}/06-input-area-only.png` });
    console.log('Screenshot: input area taken');
    break;
  }
}

// Step 7: Check for specific elements the user cares about
console.log('\n=== CHECKING SPECIFIC ITEMS ===');

// Check "Powered by Twikoo"
const poweredByText = await page.evaluate(() => {
  const allText = document.body.innerText;
  const containsPoweredBy = allText.includes('Powered by Twikoo') || allText.includes('由 Twikoo 驱动');
  // Also check for elements that might contain it
  const elements = document.querySelectorAll('*');
  for (const el of elements) {
    const text = (el.textContent || '').trim();
    if (text === 'Powered by Twikoo' || text.includes('Powered by') || text.includes('由 Twikoo')) {
      return { found: true, text: text.substring(0, 50), element: el.tagName + '.' + (el.className || '').split(' ').join('.') };
    }
  }
  return { found: containsPoweredBy };
});
console.log(`"Powered by Twikoo" visibility: ${JSON.stringify(poweredByText)}`);

// Check for send button color
const buttonInfo = await page.evaluate(() => {
  const buttons = document.querySelectorAll('button, .tk-submit-btn, .tk-btn-send, [class*="submit"], [class*="send"], [class*="btn"]');
  for (const btn of buttons) {
    const text = btn.textContent || '';
    if (text.includes('发送') || text.includes('Submit') || text.includes('评论') || btn.className.includes('submit') || btn.className.includes('send')) {
      const style = window.getComputedStyle(btn);
      return {
        text: text.trim(),
        backgroundColor: style.backgroundColor,
        color: style.color,
        className: btn.className,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      };
    }
  }
  // Also look for any element with "发送"
  const allEls = document.querySelectorAll('*');
  for (const el of allEls) {
    if ((el.textContent || '').includes('发送') && el.children.length === 0) {
      const style = window.getComputedStyle(el);
      return {
        text: (el.textContent || '').trim(),
        backgroundColor: style.backgroundColor,
        color: style.color,
        tagName: el.tagName,
        className: el.className,
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      };
    }
  }
  return { found: false };
});
console.log(`Send button info: ${JSON.stringify(buttonInfo)}`);

// Check for timestamps and "like" buttons
const timestampInfo = await page.evaluate(() => {
  const timeEls = document.querySelectorAll('time, [class*="time"], [class*="date"]');
  const likeEls = document.querySelectorAll('[class*="like"], [class*="thumb"]');
  return {
    timestampsVisible: Array.from(timeEls).slice(0, 3).map(el => {
      const style = window.getComputedStyle(el);
      return { visible: el.offsetWidth > 0, display: style.display, text: el.textContent?.trim()?.substring(0, 30) };
    }),
    likesVisible: Array.from(likeEls).slice(0, 3).map(el => {
      const style = window.getComputedStyle(el);
      return { visible: el.offsetWidth > 0, display: style.display, text: el.textContent?.trim()?.substring(0, 30) };
    })
  };
});
console.log(`Timestamp/like visibility: ${JSON.stringify(timestampInfo)}`);

console.log('\nAll screenshots saved to:', outputDir);
await browser.close();
console.log('Done!');
