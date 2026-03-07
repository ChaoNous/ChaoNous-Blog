# GitHub Copilot Instructions for ChaoNous-Blog

## 项目概述
- **框架**: Astro
- **类型**: 个人静态博客
- **部署**: Cloudflare Pages (通过 GitHub 触发)

## 代码规范
- 遵循 Astro 最佳实践
- 组件解耦，保持高性能
- 使用 TypeScript 进行类型安全

## 分支策略
- 主分支: `master`
- 部署分支: Cloudflare Pages 自动监听 `master` 分支推送

## 提交规范
- 使用中文提交信息描述修改内容
- 保持提交原子性，一个功能一个提交

## 注意事项
- 修改前确保不会破坏现有部署链路
- 测试构建通过后再推送
