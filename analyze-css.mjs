import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

async function analyzeCSS() {
  console.log('🎨 CSS 和资源分析');
  console.log('='.repeat(60));

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu']
  });

  try {
    const result = await lighthouse('https://chaonous.com/', {
      port: chrome.port,
      onlyCategories: ['performance'],
      formFactor: 'desktop',
      screenEmulation: { mobile: false, width: 1350, height: 940 },
      output: 'json',
    });

    const audits = result.lhr.audits;

    // CSS 相关
    console.log('\n📄 CSS 问题:');
    const cssAudits = ['unused-css-rules', 'unminified-css', 'modern-image-formats'];
    for (const audit of cssAudits) {
      const a = audits[audit];
      if (a && a.displayValue) {
        console.log(`  - ${a.title}: ${a.displayValue}`);
        if (a.details && a.details.items) {
          for (const item of a.details.items.slice(0, 3)) {
            const url = item.url?.split('/').pop() || '';
            const waste = item.wastedBytes ? `${(item.wastedBytes / 1024).toFixed(1)}KB` : '';
            console.log(`      ${url}: ${waste}`);
          }
        }
      }
    }

    // DOM 大小
    console.log('\n📦 DOM 统计:');
    const dom = audits['dom-size'];
    if (dom && dom.details && dom.details.items) {
      for (const item of dom.details.items) {
        console.log(`  - ${item.statistic}: ${item.value}`);
      }
    }

    // 网络请求
    console.log('\n🌐 网络请求统计:');
    const network = audits['network-requests'];
    if (network && network.details && network.details.items) {
      const items = network.details.items;
      const total = items.reduce((sum, i) => sum + (i.resourceSize || 0), 0);
      const totalTransferred = items.reduce((sum, i) => sum + (i.transferSize || 0), 0);
      console.log(`  - 总请求数: ${items.length}`);
      console.log(`  - 总资源大小: ${(total / 1024).toFixed(1)}KB`);
      console.log(`  - 传输大小: ${(totalTransferred / 1024).toFixed(1)}KB`);

      // 按类型分类
      const byType = {};
      for (const item of items) {
        const type = item.resourceType || 'other';
        if (!byType[type]) byType[type] = { count: 0, size: 0 };
        byType[type].count++;
        byType[type].size += item.resourceSize || 0;
      }
      console.log('\n  按资源类型:');
      for (const [type, data] of Object.entries(byType).sort((a, b) => b[1].size - a[1].size)) {
        console.log(`    - ${type}: ${data.count}个, ${(data.size / 1024).toFixed(1)}KB`);
      }
    }

    // 关键请求链
    console.log('\n⛓️ 关键请求链:');
    const critical = audits['critical-request-chains'];
    if (critical && critical.details && critical.details.chains) {
      const chains = critical.details.chains;
      let count = 0;
      for (const key of Object.keys(chains)) {
        if (count++ < 5) {
          const chain = chains[key];
          console.log(`  - ${chain.request?.url?.split('/').pop() || key}`);
        }
      }
    }

    // 字体
    console.log('\n🔤 字体加载:');
    const fonts = audits['font-display'];
    if (fonts && fonts.details && fonts.details.items) {
      for (const item of fonts.details.items) {
        console.log(`  - ${item.url?.split('/').pop()}: ${item.wastedMs}ms`);
      }
    }

  } finally {
    await chrome.kill();
  }
}

analyzeCSS().catch(console.error);