# 评论系统运维说明

## 当前架构

评论系统已调整为站内自托管模式，运行时不再依赖外部评论网站服务。

- 前端评论组件：`E:\ChaoNous-Blog\src\components\comment\Cnc.astro`
- 前端评论脚本：`E:\ChaoNous-Blog\src\scripts\site-comments.ts`
- 同域评论 API：`/api/comments`
- 同域后台 API：`/api/admin/comments`
- 后台入口：`https://chaonous.com/admin/`
- Pages Functions 目录：`E:\ChaoNous-Blog\functions`
- D1 初始化脚本：`E:\ChaoNous-Blog\cloudflare\d1\0001_comment_system.sql`
- 页面统计初始化脚本：`E:\ChaoNous-Blog\cloudflare\d1\0002_page_analytics.sql`
- Wrangler 配置：`E:\ChaoNous-Blog\wrangler.jsonc`

## 运行方式

当前评论系统由以下几部分组成：

1. Astro 文章页输出评论容器。
2. 本地评论脚本在页面内挂载评论列表、回复和提交表单。
3. 评论请求走站内同域 API，不再请求外部评论域名。
4. Cloudflare Pages Functions 负责评论读写与后台审核接口。
5. Cloudflare D1 负责评论与页面统计数据存储。

## 评论线程主键策略

当前统一使用文章 `canonicalUrl` 作为评论线程主键：

- `postSlug = canonicalUrl`
- `postUrl = canonicalUrl`

这样可以避免以下问题：

- alias URL 产生重复评论线程
- 尾斜杠差异导致线程分裂
- 临时访问路径与正式路径混用

## 数据库信息

- D1 数据库名：`chaonous-blog-comments`
- D1 绑定名：`COMMENTS_DB`
- 当前数据库 ID 已写入 `wrangler.jsonc`

当前表结构：

- `comments`
- `page_stats`
- `page_visitors`

主要字段：

- `post_slug`
- `post_url`
- `post_title`
- `parent_id`
- `author_name`
- `author_email`
- `author_url`
- `content`
- `status`
- `created_at`
- `updated_at`

页面统计字段：

- `page_stats.post_slug`
- `page_stats.post_url`
- `page_stats.post_title`
- `page_stats.pageviews`
- `page_stats.visits`
- `page_visitors.visitor_id`

## 审核策略

当前默认开启审核：

- 配置项：`COMMENT_REQUIRE_MODERATION`
- 默认值：`true`

行为说明：

- 前台用户提交后进入 `pending`
- 管理员在 `/admin/` 后台审核
- 审核通过后状态改为 `approved`
- 前台仅显示 `approved` 评论

## 后台认证

当前后台认证方式为同域后台密码校验。

- Secret 名称：`COMMENT_ADMIN_PASSWORD`
- Secret 已上传到 Cloudflare Pages 项目
- 前端后台页通过请求头 `x-comment-admin-password` 调用站内审核 API

注意：

- 不要把后台密码写入仓库
- 若需要轮换后台密码，应同步更新 Pages secret

## 部署要求

由于评论系统现在依赖 Pages Functions，部署方式已改为 Wrangler 部署：

- 工作流文件：`E:\ChaoNous-Blog\.github\workflows\deploy.yml`
- 部署命令：`wrangler pages deploy dist --project-name=chaonous-blog`

原因：

- 旧的纯静态目录上传方式无法满足同域 Functions + D1 绑定
- 当前部署必须同时带上 `dist` 产物和 `functions` 目录

## 页面统计

当前文章浏览量与站点总访问量也已经切换为站内实现，不再依赖外部统计脚本。

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

## 后续建议

当前版本已完成“站内运行、同域 API、同域后台、D1 存储”的基础闭环。

下一阶段建议优先做：

1. 后台密码登录改成更稳的会话机制，而不是每次请求都传密码。
2. 为评论提交增加限流与防刷策略。
3. 给评论内容增加更严格的清洗与审计策略。
4. 如需迁移旧评论，补一个导入脚本，把历史评论写入 D1。
