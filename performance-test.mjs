import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const PAGES = [
  { name: '首页', url: 'https://chaonous.com/' },
  { name: '文章页', url: 'https://chaonous.com/posts/btc-5y-forecast/' },
  { name: '归档页', url: 'https://chaonous.com/archive/' },
];

async function runLighthouse(url, formFactor, chrome) {
  const result = await lighthouse(url, {
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: formFactor,
    screenEmulation: formFactor === 'mobile'
      ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 3 }
      : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1 },
    output: 'json',
  });

  const lhr = result.lhr;
  return {
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
    metrics: {
      fcp: lhr.audits['first-contentful-paint'].displayValue,
      lcp: lhr.audits['largest-contentful-paint'].displayValue,
      tbt: lhr.audits['total-blocking-time'].displayValue,
      cls: lhr.audits['cumulative-layout-shift'].displayValue,
      si: lhr.audits['speed-index'].displayValue,
    },
    diagnostics: {
      bootupTime: lhr.audits['bootup-time']?.displayValue || 'N/A',
      mainthreadWorkBreakdown: lhr.audits['mainthread-work-breakdown']?.displayValue || 'N/A',
      renderBlocking: lhr.audits['render-blocking-resources']?.displayValue || 'N/A',
      unusedJs: lhr.audits['unused-javascript']?.displayValue || 'N/A',
      unusedCss: lhr.audits['unused-css-rules']?.displayValue || 'N/A',
      unminifiedJs: lhr.audits['unminified-javascript']?.displayValue || 'N/A',
      usesOptimizedImages: lhr.audits['uses-optimized-images']?.displayValue || 'N/A',
      offscreenImages: lhr.audits['offscreen-images']?.displayValue || 'N/A',
    }
  };
}

async function runTest() {
  console.log('='.repeat(80));
  console.log('🚀 Lighthouse 性能测试 - chaonous.com');
  console.log('时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('='.repeat(80));
  console.log();

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
  });

  const results = [];

  try {
    // 桌面端测试
    console.log('🖥️  桌面端测试');
    console.log('-'.repeat(60));

    for (let round = 1; round <= 2; round++) {
      console.log(`\n第 ${round} 轮:`);
      for (const page of PAGES) {
        process.stdout.write(`  测试 ${page.name}... `);
        const result = await runLighthouse(page.url, 'desktop', chrome);
        results.push({ device: 'desktop', round, page: page.name, ...result });
        console.log(`Performance: ${result.performance}, LCP: ${result.metrics.lcp}`);
      }
    }

    // 移动端测试
    console.log('\n\n📱 移动端测试');
    console.log('-'.repeat(60));

    for (let round = 1; round <= 2; round++) {
      console.log(`\n第 ${round} 轮:`);
      for (const page of PAGES) {
        process.stdout.write(`  测试 ${page.name}... `);
        const result = await runLighthouse(page.url, 'mobile', chrome);
        results.push({ device: 'mobile', round, page: page.name, ...result });
        console.log(`Performance: ${result.performance}, LCP: ${result.metrics.lcp}`);
      }
    }

  } finally {
    try { await chrome.kill(); } catch (e) {}
  }

  // 输出详细结果
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 详细测试结果');
  console.log('='.repeat(80));

  // 桌面端表格
  console.log('\n🖥️  桌面端:');
  console.log('┌────────────┬───────┬───────┬──────┬─────┬─────┬─────────┬─────────┬─────────┐');
  console.log('│   页面     │ 轮次  │ Perf  │ A11y │ BP  │ SEO │ LCP     │ TBT     │ CLS     │');
  console.log('├────────────┼───────┼───────┼──────┼─────┼─────┼─────────┼─────────┼─────────┤');

  const desktopResults = results.filter(r => r.device === 'desktop');
  for (const r of desktopResults) {
    console.log(`│ ${r.page.padEnd(10)} │ 第${r.round}轮 │ ${r.performance.toString().padStart(3)}   │ ${r.accessibility.toString().padStart(3)}  │ ${r.bestPractices.toString().padStart(3)} │ ${r.seo.toString().padStart(3)} │ ${r.metrics.lcp.padEnd(7)} │ ${r.metrics.tbt.padEnd(7)} │ ${r.metrics.cls.padEnd(7)} │`);
  }
  console.log('└────────────┴───────┴───────┴──────┴─────┴─────┴─────────┴─────────┴─────────┘');

  // 移动端表格
  console.log('\n📱 移动端:');
  console.log('┌────────────┬───────┬───────┬──────┬─────┬─────┬─────────┬─────────┬─────────┐');
  console.log('│   页面     │ 轮次  │ Perf  │ A11y │ BP  │ SEO │ LCP     │ TBT     │ CLS     │');
  console.log('├────────────┼───────┼───────┼──────┼─────┼─────┼─────────┼─────────┼─────────┤');

  const mobileResults = results.filter(r => r.device === 'mobile');
  for (const r of mobileResults) {
    console.log(`│ ${r.page.padEnd(10)} │ 第${r.round}轮 │ ${r.performance.toString().padStart(3)}   │ ${r.accessibility.toString().padStart(3)}  │ ${r.bestPractices.toString().padStart(3)} │ ${r.seo.toString().padStart(3)} │ ${r.metrics.lcp.padEnd(7)} │ ${r.metrics.tbt.padEnd(7)} │ ${r.metrics.cls.padEnd(7)} │`);
  }
  console.log('└────────────┴───────┴───────┴──────┴─────┴─────┴─────────┴─────────┴─────────┘');

  // 计算平均值
  const avgDesktopPerf = Math.round(desktopResults.reduce((a, b) => a + b.performance, 0) / desktopResults.length);
  const avgMobilePerf = Math.round(mobileResults.reduce((a, b) => a + b.performance, 0) / mobileResults.length);

  console.log('\n📈 平均性能得分:');
  console.log(`  🖥️  桌面端: ${avgDesktopPerf}`);
  console.log(`  📱 移动端: ${avgMobilePerf}`);

  // 诊断信息
  console.log('\n🔍 首页性能诊断 (桌面端):');
  const homeDesktop = desktopResults.find(r => r.page === '首页' && r.round === 1);
  if (homeDesktop) {
    console.log(`  - FCP: ${homeDesktop.metrics.fcp}`);
    console.log(`  - LCP: ${homeDesktop.metrics.lcp}`);
    console.log(`  - TBT: ${homeDesktop.metrics.tbt}`);
    console.log(`  - CLS: ${homeDesktop.metrics.cls}`);
    console.log(`  - SI:  ${homeDesktop.metrics.si}`);
  }

  console.log('\n🔍 首页性能诊断 (移动端):');
  const homeMobile = mobileResults.find(r => r.page === '首页' && r.round === 1);
  if (homeMobile) {
    console.log(`  - FCP: ${homeMobile.metrics.fcp}`);
    console.log(`  - LCP: ${homeMobile.metrics.lcp}`);
    console.log(`  - TBT: ${homeMobile.metrics.tbt}`);
    console.log(`  - CLS: ${homeMobile.metrics.cls}`);
    console.log(`  - SI:  ${homeMobile.metrics.si}`);
  }

  return results;
}

runTest().catch(console.error);