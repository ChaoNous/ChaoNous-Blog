# 内容仓库更新自动触发构建 - 快速参考

> 当前代码仓库主分支为 `master`。

## 🎯 问题

启用内容分离后,内容仓库 (Mizuki-Content) 更新不会自动触发代码仓库 (Mizuki) 的重新部署。

## ✅ 解决方案 (推荐)

对当前仓库，推荐使用 **Repository Dispatch + Cloudflare Deploy Hook**：
- 内容仓库推送后，先用 `repository_dispatch` 通知代码仓库
- 代码仓库再通过 GitHub Actions 调用 Cloudflare Pages 的 Deploy Hook

---

## 📝 5 步快速配置

### Step 1: 创建 GitHub Token

访问: https://github.com/settings/tokens

- 点击 **Generate new token (classic)**
- Note: `Mizuki Content Trigger`
- Scopes: 勾选 ✅ `repo`
- 点击生成并**复制 Token** ⚠️ (只显示一次)

### Step 2: 添加 Secret

在**内容仓库** (Mizuki-Content):

Settings → Secrets and variables → Actions → New repository secret

- Name: `DISPATCH_TOKEN`
- Secret: 粘贴刚才的 Token

### Step 3: 修改触发器配置

编辑内容仓库的 `.github/workflows/trigger-build.yml`

找到第 27 行,修改为你的代码仓库:

```yaml
repository: your-username/Mizuki  # 改为你的
```

例如: `matsuzaka-yuki/Mizuki`

### Step 4: 更新代码仓库工作流

编辑**代码仓库**中新建的工作流文件,例如 `.github/workflows/content-sync.yml`

在代码仓库 Secrets 中先添加 `CLOUDFLARE_DEPLOY_HOOK`，然后使用如下工作流：

```yaml
name: Trigger Cloudflare Pages

on:
  repository_dispatch:  # 👈 添加这个
    types:
      - content-updated
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cloudflare Pages Deploy Hook
        run: curl -X POST "${{ secrets.CLOUDFLARE_DEPLOY_HOOK }}"
```

### Step 5: 测试

在内容仓库推送一次，并确认目标仍是代码仓库的 `master` 分支:

```bash
git add .
git commit -m "test: trigger build"
git push
```

查看:
1. 内容仓库 Actions - 确认触发器运行
2. 代码仓库 Actions - 确认 `Trigger Cloudflare Pages` 被触发
3. Cloudflare Pages - 确认出现新的部署记录

---

## 🔍 故障排查

### Token 问题

**错误**: `Bad credentials`

**解决**:
- 确认 Token 复制完整
- 确认 Token 有 `repo` 权限
- 重新生成 Token

### 仓库名称问题

**错误**: `Not Found`

**解决**:
- 确认格式: `owner/repo` (用斜杠分隔)
- 确认拼写正确
- 示例: `matsuzaka-yuki/Mizuki`

### 代码仓库未触发

**检查**:
- [ ] 新建的 GitHub Actions 工作流包含 `repository_dispatch`
- [ ] 已在代码仓库中配置 `CLOUDFLARE_DEPLOY_HOOK`
- [ ] Event type 为 `content-updated`
- [ ] 代码仓库 Actions 已启用

---

## 📚 详细文档

需要更多配置选项? 查看:
- [部署指南 - 完整说明](./DEPLOYMENT.md#内容仓库更新触发构建) - 包含 Webhook、定时构建等其他方案
- [内容仓库配置指南](../Mizuki-Content/.github/workflows/README.md) - 工作流详细说明

---

## 💡 提示

配置成功后:
- ✅ 内容仓库每次推送都会自动触发部署
- ✅ 可在 Actions 页面查看触发历史
- ✅ 支持手动触发 (workflow_dispatch)

---

**配置时间**: 约 5 分钟  
**一次配置,长期有效** ✨
