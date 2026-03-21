/**
 * 构建优化脚本
 * - 优化缓存策略
 * - 生成预加载提示
 * - 清理不必要的文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

console.log('🚀 开始构建优化...\n');

// 1. 优化 _headers 文件 (Cloudflare Pages)
const headersPath = path.join(distPath, '_headers');
const headersContent = `
# Security headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()

# Cache static assets for 1 year
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Cache fonts for 1 year
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

# Cache images for 1 month
/assets/*
  Cache-Control: public, max-age=2592000

# HTML files - shorter cache for quick updates
/*.html
  Cache-Control: public, max-age=3600

# Music files - cache for 1 week
/assets/music/*
  Cache-Control: public, max-age=604800
`.trim();

fs.writeFileSync(headersPath, headersContent);
console.log('✅ 优化 _headers 缓存策略');

// 2. 生成预加载提示文件
const preloadPath = path.join(distPath, 'preload-hints.html');
const preloadContent = `<!-- 预加载提示 - 可选嵌入到 Layout.astro -->
<!-- 预连接关键域名 -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.injahow.cn" crossorigin>

<!-- 预加载关键资源 (根据实际构建输出调整) -->
<!-- <link rel="preload" href="/_astro/Layout.BTJAPp-Q.js" as="script"> -->
<!-- <link rel="preload" href="/_astro/main.css" as="style"> -->
`.trim();

fs.writeFileSync(preloadPath, preloadContent);
console.log('✅ 生成预加载提示');

// 3. 清理 dist 中的大文件（音乐文件保留但记录警告）
const musicPath = path.join(distPath, 'assets', 'music', 'url');
if (fs.existsSync(musicPath)) {
  const musicFiles = fs.readdirSync(musicPath);
  let totalSize = 0;
  
  musicFiles.forEach(file => {
    const filePath = path.join(musicPath, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  });
  
  console.log(`⚠️  音乐文件总大小：${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('💡 建议：考虑使用流式加载或外部 CDN 托管音乐文件\n');
}

// 4. 生成优化报告
const reportPath = path.join(distPath, 'optimization-report.json');
const report = {
  timestamp: new Date().toISOString(),
  optimizations: [
    '缓存策略优化 (_headers)',
    '预加载提示生成',
    '音乐文件流式加载建议',
    '字体压缩待启用',
  ],
  recommendations: [
    '启用字体压缩 (config.ts: enableCompress: true)',
    '音乐文件使用 CDN 托管',
    '图片使用 AVIF 格式',
    '考虑使用 Web Vitals 监控',
  ],
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log('✅ 生成优化报告\n');

console.log('🎉 优化完成！');
console.log('\n📊 下一步建议:');
console.log('1. 在 config.ts 中启用字体压缩: enableCompress: true');
console.log('2. 考虑将音乐文件迁移到外部 CDN');
console.log('3. 运行 pnpm build 重新构建');
