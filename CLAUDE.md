\# ChaoNous Blog — Claude Code 上下文



\## 项目概览

\- 框架：Astro + Svelte + TypeScript

\- 样式：CSS / Stylus / PostCSS

\- 主题风格：Material Design 3

\- 包管理：pnpm（使用 pnpm-workspace.yaml，禁止用 npm/yarn）

\- 搜索：Pagefind（pagefind.yml）

\- 代码格式化：Prettier（.prettierrc）



\## 目录结构

\- src/         — 源码（组件、页面、样式、内容）

\- public/      — 静态资源

\- scripts/     — 构建辅助脚本

\- docs/image/  — 文档用图片



\## 部署链路

\- 仓库：https://github.com/ChaoNous/ChaoNous-Blog（分支：master）

\- 部署：push 到 master → Cloudflare Pages 自动构建部署 → chaonous.com

\- 本地构建命令：pnpm run check \&\& pnpm run build

\- 本地开发命令：pnpm dev



\## 开发规范

\- 所有文件使用 UTF-8 编码

\- 遵循 Astro 最佳实践：组件解耦、Island 架构、按需 hydration

\- Svelte 组件只用于需要交互的 Island，静态内容用 .astro 组件

\- 不破坏现有的 Cloudflare Pages 自动部署链路

\- 修改完成后：git add → git commit（用简洁的英文 commit message）→ git push origin master



\## 注意事项

\- .env 文件不提交（见 .gitignore）

\- pnpm-lock.yaml 需随依赖变动一起提交

\- 有 .devin / .qoder / .github 目录，不要随意修改其中配置

