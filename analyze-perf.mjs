import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const URL = 'https://chaonous.com/';

async function runDetailedAnalysis() {
  console.log('🔍 详细性能分析 - 桌面端首页');
  console.log('='.repeat(60));

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
  });

  try {
    const result = await lighthouse(URL, {
      port: chrome.port,
      onlyCategories: ['performance'],
      formFactor: 'desktop',
      screenEmulation: { mobile: false, width: 1350, height: 940 },
      output: 'json',
    });

    const lhr = result.lhr;
    const audits = lhr.audits;

    // 核心指标
    console.log('\n📊 核心 Web 指标:');
    console.log(`  LCP: ${audits['largest-contentful-paint'].displayValue}`);
    console.log(`  FID: ${audits['total-blocking-time'].displayValue}`);
    console.log(`  CLS: ${audits['cumulative-layout-shift'].displayValue}`);
    console.log(`  FCP: ${audits['first-contentful-paint'].displayValue}`);
    console.log(`  SI:  ${audits['speed-index'].displayValue}`);
    console.log(`  TTI: ${audits['interactive'].displayValue}`);

    // 诊断问题
    console.log('\n🔴 主要问题:');

    const problemAudits = [
      'bootup-time',
      'mainthread-work-breakdown',
      'render-blocking-resources',
      'unused-javascript',
      'unused-css-rules',
      'unminified-javascript',
      'unminified-css',
      'uses-optimized-images',
      'offscreen-images',
      'uses-text-compression',
      'uses-responsive-images',
      'efficient-animated-content',
      'diagnostics',
    ];

    for (const audit of problemAudits) {
      const a = audits[audit];
      if (a && a.displayValue) {
        const score = a.score;
        const status = score !== null ? (score < 0.5 ? '❌' : score < 0.9 ? '⚠️' : '✅') : 'ℹ️';
        console.log(`  ${status} ${a.title}: ${a.displayValue}`);
      }
    }

    // 渲染阻塞资源
    console.log('\n🧱 渲染阻塞资源:');
    const blocking = audits['render-blocking-resources'];
    if (blocking && blocking.details && blocking.details.items) {
      for (const item of blocking.details.items) {
        console.log(`  - ${item.url || item.node?.snippet || JSON.stringify(item)}`);
      }
    }

    // 长任务
    console.log('\n⏱️ 主线程工作:');
    const mainthread = audits['mainthread-work-breakdown'];
    if (mainthread && mainthread.details && mainthread.details.items) {
      for (const item of mainthread.details.items) {
        console.log(`  - ${item.group}: ${item.duration}ms`);
      }
    }

    // JavaScript 执行时间
    console.log('\n📜 JavaScript 执行时间:');
    const bootup = audits['bootup-time'];
    if (bootup && bootup.details && bootup.details.items) {
      const items = bootup.details.items.slice(0, 10);
      for (const item of items) {
        console.log(`  - ${item.url?.split('/').pop()}: ${item.total || item.scripting}ms`);
      }
    }

    // 未使用的 JS
    console.log('\n🗑️ 未使用的 JavaScript:');
    const unusedJs = audits['unused-javascript'];
    if (unusedJs && unusedJs.details && unusedJs.details.items) {
      for (const item of unusedJs.details.items.slice(0, 5)) {
        const waste = item.wastedBytes ? `${(item.wastedBytes / 1024).toFixed(1)}KB` : '';
        console.log(`  - ${item.url?.split('/').pop()}: ${waste}`);
      }
    }

    // LCP 元素
    console.log('\n🖼️ LCP 元素:');
    const lcp = audits['largest-contentful-paint-element'];
    if (lcp && lcp.details && lcp.details.items) {
      for (const item of lcp.details.items) {
        console.log(`  - ${item.node?.snippet || JSON.stringify(item)}`);
      }
    }

    console.log('\n' + '='.repeat(60));

  } finally {
    await chrome.kill();
  }
}

runDetailedAnalysis().catch(console.error);