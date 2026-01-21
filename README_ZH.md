# Cowork - AI 驱动的智能工作助手

<p align="center">
  <img src="image.jpg" alt="Cowork Logo" width="200"/>
</p>

<p align="center">
  <strong>一个像人类同事一样工作的智能桌面助手</strong>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="#核心功能">核心功能</a> |
  <a href="#快速开始">快速开始</a> |
  <a href="#架构设计">架构设计</a>
</p>

---

## 概述

**Cowork** 是一款基于 Tauri + Node.js + SolidJS 构建的 AI 驱动桌面应用，它作为你的智能工作助手。与传统的 AI 聊天机器人不同，Cowork 能够自主管理任务、处理本地文件、与你的电脑环境交互——就像一位能干的人类同事。

## 核心功能

### 1. 任务自主管理（像人一样"接活"）

这是 Cowork 的核心逻辑：用户给目标，它负责过程。

- **目标拆解与规划**：能够把一个模糊的大目标（如"筹备下周会议"）自动拆成一系列小动作
- **后台异步执行**：用户下达指令后可以离开，它在后台默默工作，完成后发通知
- **进度实时看板**：用户可以随时看到它"正在做什么"、"已经完成了什么"以及"下一步计划"
- **任务队列**：支持同时处理多个任务，并能根据紧急程度排序

### 2. 深度文件处理（像人一样"翻文件夹"）

这是它与普通 AI 最直观的区别：它拥有对你本地文件的"读写权"。

- **跨格式理解**：能像人眼一样看懂 PDF、Excel、Word 甚至是桌面上的混乱截图
- **自动化整理**：能够根据内容（而不是文件名）对杂乱的文件夹进行分类、重命名和归档
- **多文档联动分析**：能同时打开多个文件（比如 10 份简历），总结出其中的共性或差异
- **内容创作与编辑**：不仅是生成文本，而是能直接在你的本地目录里生成一个可用的 `.xlsx` 或 `.docx` 文件

### 3. 环境与应用操作（像人一样"用电脑"）

它拥有"手"和"眼"，可以跨越软件的边界。

- **网页端自动化**：能替你去网页上搜索信息、填写复杂的表单、或者从特定的网站抓取数据
- **跨软件搬运**：实现"数据搬运工"的功能，例如把邮件里的附件内容提取出来，填进你的本地 Excel 表格里
- **系统级搜索**：能帮你找那些"你记得有，但不知道放在哪"的文件或邮件

### 4. 协作与授信（像人一样"请示汇报"）

为了让用户放心，它必须有一套完善的权限与沟通机制。

- **关键节点请示**：在执行删除文件、支付、发送邮件等不可逆的操作前，会停下来问："我可以这样做吗？"
- **模糊指令澄清**：当它不确定你的意图时，会像助理一样反问："你是想按日期分类，还是按项目分类？"
- **工作总结报告**：任务结束后，会生成一份简洁的清单，告诉你它刚才具体做了哪些改动

### 5. 技能学习与定制（像人一样"学规矩"）

用户可以把它调教成自己最顺手的样子。

- **SOP 记忆**：可以教它一套特定的工作流程（例如：每周五下午帮我把这三个文件夹的东西汇总），它以后就能自动执行
- **偏好设定**：它能记住你喜欢的命名格式、常用的邮件语气或者是特定的文件存放习惯

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | SolidJS + TypeScript |
| 桌面运行时 | Tauri 2.x (Rust) |
| 后端 | Node.js + Claude Agent SDK |
| IPC 通信 | Tauri Commands + Event System |
| 样式 | CSS 自定义属性 (黑曜石黑主题) |

## 快速开始

### 环境要求

- **Node.js** >= 20.0.0
- **Rust** >= 1.77.2
- **pnpm** 或 **npm**

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/cowork-replica.git
cd cowork-replica

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加你的 ANTHROPIC_API_KEY
```

### 开发模式

```bash
# 启动 Tauri 开发服务器（会自动启动 vite 前端服务）
npm run tauri:dev
```

如需同时开发 CLI 工具，可在另一个终端运行：

```bash
# 启动 TypeScript 编译监听（仅 CLI 开发需要）
npm run dev:cli
```

### 生产构建

```bash
# 构建生产版本
npm run tauri:build
```

构建完成后，应用程序将位于 `src-tauri/target/release/bundle/` 目录。

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行集成测试
npm run test:integration
```

## 项目结构

```
cowork-replica/
├── src/                    # Node.js 后端源码
│   ├── core/              # 核心业务逻辑
│   ├── sdk/               # Claude Agent SDK 集成
│   ├── tools/             # 工具实现
│   ├── permissions/       # 权限管理
│   └── ui/                # UI 抽象层
├── src-ui/                # SolidJS 前端源码
│   ├── components/        # UI 组件
│   │   ├── common/       # Button, Input, Modal
│   │   └── Layout.ts     # 布局框架
│   ├── services/          # IPC 服务
│   ├── styles/            # 主题系统
│   └── infrastructure/    # 集成模块
├── src-tauri/             # Rust/Tauri 源码
│   ├── src/
│   │   ├── main.rs       # 入口点
│   │   ├── ipc.rs        # IPC 桥接
│   │   └── process.rs    # 进程管理
│   └── tauri.conf.json   # Tauri 配置
└── tests/                 # 测试文件
    ├── e2e/              # 端到端测试
    └── integration/      # 集成测试
```

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     SolidJS 前端                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    组件     │  │    主题     │  │     IPC 服务        │ │
│  │  (UI Kit)   │  │    系统     │  │    (Tauri API)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ Tauri Events / Commands
┌──────────────────────────┴──────────────────────────────────┐
│                      Rust IPC 桥接层                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    消息     │  │    进程     │  │      事件           │ │
│  │    路由     │  │    管理     │  │      发射器         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ stdin/stdout JSON
┌──────────────────────────┴──────────────────────────────────┐
│                    Node.js 后端                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Claude    │  │    工具     │  │      权限           │ │
│  │  Agent SDK  │  │    注册表   │  │      管理器         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 通信流程

```
用户交互 → SolidJS 前端 → Tauri invoke → Rust IPC 桥接
                                              ↓
                                         Node.js stdin
                                              ↓
                                         后端处理
                                              ↓
                                         Node.js stdout
                                              ↓
                                         Rust 解析
                                              ↓
                                         Tauri emit → 前端更新
```

## 环境变量

在项目根目录创建 `.env` 文件：

```env
# 必需
ANTHROPIC_API_KEY=your_api_key_here

# 可选
NODE_ENV=development
LOG_LEVEL=debug
```

## 脚本命令参考

| 脚本 | 描述 |
|------|------|
| `npm run dev` | 启动 TypeScript 编译监听 |
| `npm run build` | 编译 TypeScript 到 JavaScript |
| `npm run tauri:dev` | 启动 Tauri 开发服务器 |
| `npm run tauri:build` | 构建生产版 Tauri 应用 |
| `npm test` | 运行 Jest 测试 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run format` | 使用 Prettier 格式化代码 |

## 设计规范

### 黑曜石黑主题

应用采用深色主题设计，主要颜色：

| 变量 | 颜色 | 用途 |
|------|------|------|
| `--bg-primary` | #0D0D0D | 主背景色 |
| `--bg-secondary` | #141414 | 次级背景色 |
| `--bg-elevated` | #1A1A1A | 提升背景色 |
| `--text-primary` | #FAFAFA | 主文本色 |
| `--accent-primary` | #6366F1 | 主强调色 |

### 窗口约束

- 最小宽度: 1200px
- 最小高度: 800px
- 侧边栏宽度: 240px (可折叠至 64px)

## 贡献指南

请阅读 [CONTRIBUTING_ZH.md](./CONTRIBUTING_ZH.md) 了解贡献代码的流程和规范。

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](./LICENSE) 文件。

## 致谢

- [Anthropic](https://www.anthropic.com/) 提供 Claude Agent SDK
- [Tauri](https://tauri.app/) 提供桌面运行时框架
- [SolidJS](https://www.solidjs.com/) 提供响应式 UI 框架
