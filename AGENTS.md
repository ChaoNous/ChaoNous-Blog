# AGENTS.md

## 项目概览

- 项目名称：`ChaoNous-Blog`
- 本地路径：`E:\ChaoNous-Blog`
- 框架：Astro
- 仓库地址：`https://github.com/ChaoNous/ChaoNous-Blog`
- 默认分支：`main`
- 线上域名：`https://chaonous.com/`
- 构建输出目录：`E:\ChaoNous-Blog\dist`

## 当前事实来源

以下信息以仓库当前配置为准：

- Astro 与构建脚本定义见 `E:\ChaoNous-Blog\package.json`
- 站点域名与 Astro 主配置见 `E:\ChaoNous-Blog\src\config.ts` 和 `E:\ChaoNous-Blog\astro.config.mjs`
- 部署流程见 `E:\ChaoNous-Blog\.github\workflows\deploy.yml`

## 实际部署链路

当前项目的真实部署流程为：

1. 代码进入 GitHub 仓库 `main` 分支。
2. GitHub Actions 触发工作流 `Deploy to Cloudflare Pages`。
3. 工作流使用 Node.js 22 和 pnpm 安装依赖并执行 `pnpm run build`。
4. 构建产物从 `dist` 目录上传到 Cloudflare Pages。
5. Cloudflare Pages 发布到 `chaonous.com`。

说明：

- 当前不是“Cloudflare 直接监听 GitHub 仓库自动构建”的单一路径。
- 当前是“GitHub Actions 构建并调用 Cloudflare Pages API 部署”。

## 开发与执行准则

- 优先遵循 Astro 最佳实践：组件解耦、静态优先、性能优先。
- 修改前先确认是否会影响现有 GitHub Actions 与 Cloudflare Pages 部署链路。
- 输出文件统一使用 UTF-8 编码。
- 涉及站点配置、构建、内容生成时，优先保持 `dist` 可稳定产出。
- 若任务包含验证，至少执行与任务相关的检查命令。

## 本地环境注意事项

当前仓库环境已确认以下事实：

- Node.js 可用，且当前检测到版本高于项目要求的 Node 22。
- `pnpm` 在 PowerShell 下可能被执行策略拦截，因此优先使用 `pnpm.cmd`。
- 当前会话环境未检测到可用的 `git` 命令；不要假设本地一定能直接执行 `git add`、`git commit`、`git push`。

推荐命令：

- 安装依赖：`pnpm.cmd install --frozen-lockfile`
- 类型与 Astro 检查：`pnpm.cmd run check`
- 生产构建：`pnpm.cmd run build`
- 本地预览：`pnpm.cmd run preview`

## Git 与发布约束

- 若本地 `git` 可用，优先走正常的本地提交流程。
- 若本地 `git` 不可用，不要伪造“已提交”或“已推送”的结果。
- 若必须直接通过 GitHub API 提交文件，优先使用 `E:\ChaoNous-Blog\scripts\github-commit-files.mjs`，按原始字节 base64 提交，避免中文文案被错误转码成 `?`。
- commit message 使用简明英文。
- 未经明确确认，不要改动 GitHub Actions 部署工作流中的关键部署参数。

## Secrets 与安全要求

- 严禁在仓库、文档、Issue、提交记录或对话说明中写入明文 GitHub Token、Cloudflare Token 或其他密钥。
- 所有令牌应仅通过本地安全环境变量、系统凭据管理器或 GitHub Secrets / Cloudflare Secrets 管理。
- 如果发现密钥曾被明文暴露，应视为已泄露并立即轮换。

## 变更执行标准

若任务需要多步骤执行，输出应包含：

1. 每一步实际执行了什么。
2. 每一步的结果。
3. 若失败，给出阻塞原因。
4. 若失败可修复，给出下一步修复方案。

## 当前已验证状态

截至 2026-04-07，本地已验证：

- `pnpm.cmd run check` 可通过。
- `pnpm.cmd run build` 可成功生成 `E:\ChaoNous-Blog\dist`。
- 当前存在非阻断提示，但未发现会直接阻止构建发布的错误。
