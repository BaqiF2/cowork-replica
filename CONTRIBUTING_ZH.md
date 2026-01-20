# 贡献指南

## 3. 日常开发：如何同步脚手架的更新？

如果以后你对脚手架 `scaffold-project` 做了功能增强，想在 `my-new-app` 中也用上这些新代码：

```bash
# 拉取上游脚手架的最新改动
git fetch upstream

# 将脚手架的改动合并到当前新项目的分支
git merge upstream/main

```

---

### 4. 关键步骤：如何向脚手架提 PR？

当你在开发新项目时，发现脚手架有个 Bug，需要修复并回馈给原项目：

#### 第一步：在本地创建修复分支

不要在 `main` 分支改，先切一个临时分支：

```bash
git checkout -b fix-scaffold-bug

```

#### 第二步：修复代码并提交

完成修复后，提交到本地仓库：

```bash
git add .
git commit -m "fix: 修复了脚手架中的某个逻辑错误"

```

#### 第三步：推送到【上游脚手架】仓库

注意，这里是推送到 `upstream` 而不是 `origin`：

```bash
git push upstream fix-scaffold-bug

```

#### 第四步：在 GitHub 网页发起 PR

1. 打开你的**原脚手架项目**（`scaffold-project`）页面。
2. 你会看到一个黄色提示框，显示你刚刚推送了 `fix-scaffold-bug` 分支。
3. 点击 **Compare & pull request**，填写描述并提交。