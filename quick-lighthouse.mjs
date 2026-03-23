import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function run() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
  const result = await lighthouse('https://chaonous.com', {
    port: chrome.port,
    onlyCategories: ['performance'],
    formFactor: 'desktop',
    screenEmulation: { mobile: false },
    output: 'json',
  });
  await chrome.kill();
  
  const lhr = result.lhr;
  const metrics = {
    fcp: lhr.audits['first-contentful-paint'].numericValue,
    lcp: lhr.audits['largest-contentful-paint'].numericValue,
    tbt: lhr.audits['total-blocking-time'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    score: lhr.categories.performance.score * 100,
  };
  
  console.log(JSON.stringify(metrics, null, 2));
}

run().catch(console.error);
