# 评论系统运维说明

## 当前架构

评论系统已经完全运行在站内，不依赖外部评论服务网站。

- 前端评论组件：`E:\ChaoNous-Blog\src\components\comment\Cnc.astro`
- 前端评论脚本：`E:\ChaoNous-Blog\src\scripts\site-comments.ts`
- 同域评论 API：`/api/comments`
- 同域后台 API：`/api/admin/comments`
- 后台会话 API：`/api/admin/session`
- 后台入口：`https://chaonous.com/admin/`
- Pages Functions 目录：`E:\ChaoNous-Blog\functions`
- 评论表初始化脚本：`E:\ChaoNous-Blog\cloudflare\d1\0001_comment_system.sql`
- 页面统计初始化脚本：`E:\ChaoNous-Blog\cloudflare\d1\0002_page_analytics.sql`
- 评论状态列迁移脚本：`E:\ChaoNous-Blog\cloudflare\d1\0003_drop_comment_status.sql`
- 后台会话表迁移脚本：`E:\ChaoNous-Blog\cloudflare\d1\0004_admin_sessions.sql`
- Wrangler 配置：`E:\ChaoNous-Blog\wrangler.jsonc`

## 运行方式

当前评论系统由以下部分组成：

1. Astro 文章页输出评论容器。
2. 本地评论脚本在页面内挂载评论列表、回复和提交表单。
3. 评论请求走站内同域 API，不再请求外部评论域名。
4. Cloudflare Pages Functions 负责评论读写、后台登录和管理接口。
5. Cloudflare D1 负责评论与页面统计数据存储。

## 评论线程主键策略

当前统一使用文章 `canonicalUrl` 作为评论线程主键：

- `postSlug = canonicalUrl`
- `postUrl = canonicalUrl`

这样可以避免：

- alias URL 产生重复评论线程
- 尾斜杠差异导致线程分裂
- 临时访问路径与正式路径混用

## 数据库信息

- D1 数据库名：`chaonous-blog-comments`
- D1 绑定名：`COMMENTS_DB`
- 当前数据库 ID 已写入 `E:\ChaoNous-Blog\wrangler.jsonc`

当前表结构：

- `comments`
- `page_stats`
- `page_visitors`
- `admin_sessions`

`comments` 主要字段：

- `post_slug`
- `post_url`
- `post_title`
- `parent_id`
- `author_name`
- `author_email`
- `author_url`
- `content`
- `created_at`
- `updated_at`

说明：

- `status` 列已经从数据库和业务逻辑中彻底移除
- 所有评论一律直接发布
- 删除父评论时，会递归删除其全部子回复

## 后台管理能力

当前后台已支持：

- 会话制登录
- 自动校验当前会话
- 单条删除评论
- 批量删除评论
- 评论数据导出
- 页面统计数据导出

后台核心文件：

- 后台页面：`E:\ChaoNous-Blog\public\admin\index.html`
- 后台脚本：`E:\ChaoNous-Blog\public\admin\comments-admin.js`
- 会话接口：`E:\ChaoNous-Blog\functions\api\admin\session.ts`
- 评论列表接口：`E:\ChaoNous-Blog\functions\api\admin\comments\index.ts`
- 单条删除接口：`E:\ChaoNous-Blog\functions\api\admin\comments\[id].ts`
- 批量操作接口：`E:\ChaoNous-Blog\functions\api\admin\comments\bulk.ts`

## 后台认证

当前后台认证方式为同域会话登录：

- 登录凭据 Secret：`COMMENT_ADMIN_PASSWORD`
- 会话 Cookie 名：`cnc_admin_session`
- 登录接口：`POST /api/admin/session`
- 会话检查接口：`GET /api/admin/session`
- 登出接口：`DELETE /api/admin/session`

安全特性：

- Cookie 为 `HttpOnly`
- Cookie 为 `Secure`
- Cookie 为 `SameSite=Strict`
- 前端不会再把后台密码保存到本地存储
- 后台 API 不再依赖 `x-comment-admin-password` 请求头

## 部署要求

由于评论系统依赖 Pages Functions 和 D1，部署方式必须保留 Wrangler / Pages Functions 链路。

- 工作流文件：`E:\ChaoNous-Blog\.github\workflows\deploy.yml`
- 部署命令：`wrangler pages deploy dist --project-name=chaonous-blog`

说明：

- 纯静态目录上传无法满足同域 Functions + D1 绑定
- 当前部署必须同时带上 `dist` 产物和 `functions` 目录

## 页面统计

文章浏览量与站点访问量也已改为站内实现：

- 文章统计接口：`/api/analytics/pv`
- 文章访问写入接口：`/api/analytics/visit`
- 站点统计接口：`/api/analytics/site`
- 文章显示组件：`E:\ChaoNous-Blog\src\components\PostMeta.astro`
- 侧栏显示组件：`E:\ChaoNous-Blog\src\components\widget\Profile.astro`

统计策略：

- 文章统计主键统一使用 `canonicalUrl`
- 每个访客在浏览器本地保存 `visitorId`
- 每次页面访问增加 `pageviews`
- 同一访客首次访问该文章时增加 `visits`

## 本地检查建议

涉及评论系统改动时，至少执行：

- `pnpm.cmd run check`
- `pnpm.cmd run build`

如需验证数据库结构变更，可执行：

- `pnpm.cmd dlx wrangler@4 d1 execute chaonous-blog-comments --remote --file=cloudflare/d1/0001_comment_system.sql`
- `pnpm.cmd dlx wrangler@4 d1 execute chaonous-blog-comments --remote --file=cloudflare/d1/0002_page_analytics.sql`
- `pnpm.cmd dlx wrangler@4 d1 execute chaonous-blog-comments --remote --file=cloudflare/d1/0003_drop_comment_status.sql`
