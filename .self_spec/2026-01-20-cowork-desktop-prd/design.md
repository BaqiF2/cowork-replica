# Cowork Desktop 桌面端产品需求文档 (PRD)

## 文档信息
- **项目名称**: Cowork Desktop - 基于 Claude 的智能工作助手桌面应用
- **文档版本**: v1.0
- **创建日期**: 2026-01-20
- **目标平台**: macOS
- **技术栈**: Tauri + SolidJS + TypeScript + Node.js

---

## 一、项目背景

### 1.1 产品愿景
复刻 Claude Cowork 的核心能力,打造一款桌面端智能工作助手,具备以下特性:
- 像人一样"接活": 目标拆解、后台执行、进度可视化、任务队列
- 像人一样"翻文件夹": 跨格式文档理解、自动化整理、多文档联动分析
- 像人一样"用电脑": 系统集成、原生通知、文件系统操作
- 像人一样"请示汇报": 权限管理、模糊指令澄清、工作总结
- 像人一样"学规矩": Skills 技能系统、用户偏好记忆

### 1.2 产品定位
- **用户群体**: 需要 AI 辅助处理复杂工作流的专业用户
- **核心价值**: 提供比 CLI 更直观的可视化界面,比 Web 端更强的本地文件处理能力
- **差异化**: 参考 OpenWork 的 UI/UX 设计,结合现有项目的成熟架构

### 1.3 技术决策
- **前端**: Tauri + SolidJS (轻量、高性能、现代化)
- **后端**: Node.js Backend (100% 复用现有 TypeScript 代码)
- **通信**: Tauri IPC (Rust ↔ Node.js ↔ SolidJS)
- **主题**: 黑曜石黑 + 现代简约风格
- **平台**: 仅 macOS (初期)

---

## 二、核心架构

### 2.1 分层架构设计

```
┌─────────────────────────────────────────────────────────┐
│               Tauri Frontend Layer (SolidJS)            │
│     Dashboard | Chat | Tasks | Files | Settings         │
└────────────────────┬────────────────────────────────────┘
                     │ IPC Commands
┌────────────────────┴────────────────────────────────────┐
│            Tauri Backend Layer (Rust + Node.js)         │
│  - IPC Command Handlers                                 │
│  - Node.js Process Manager                              │
│  - macOS System Integration                             │
└─────────────────┬───────────────────────────────────────┘
                  │ Stdio/IPC
┌─────────────────┴───────────────────────────────────────┐
│          Node.js Backend (复用 + 新增)                   │
│  ┌─ Desktop UI Layer (NEW)                              │
│  │  - DesktopUIFactory                                  │
│  │  - DesktopInteractiveUI                              │
│  │  - IPCMessageAdapter                                 │
│  ┌─ Desktop Business Layer (NEW)                        │
│  │  - TaskQueueManager (任务队列)                        │
│  │  - SystemIntegrationService (系统集成)                │
│  │  注: 文档解析通过 Skills 实现                         │
│  ┌─ Runner Layer (REUSE + EXTEND)                       │
│  │  - InteractiveRunner (复用)                           │
│  │  - DesktopRunner (新增)                               │
│  ┌─ Business Layer (REUSE 100%)                         │
│  │  - MessageRouter, SessionManager, PermissionManager  │
│  │  - CheckpointManager, HookManager, MCPManager        │
│  └─ SDK Layer (REUSE 100%)                              │
│     - SDKQueryExecutor, StreamingQueryManager           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 关键技术决策理由

**为什么选择 Node.js Backend?**
- 100% 复用现有 TypeScript 代码,避免用 Rust 重写
- 快速迭代,利用 npm 生态 (文档解析库等)

**为什么选择 Tauri 而非 Electron?**
- 包体积更小 (< 10MB vs > 100MB)
- 性能更好 (原生 Rust vs Chromium)
- 安全性更强 (严格的权限系统)

**为什么选择 SolidJS 而非 React?**
- 性能更优 (细粒度响应式,无虚拟 DOM)
- 体积更小 (核心 < 10KB)
- 状态管理更简单 (Signals 原生支持)

---

## 三、MVP 功能清单

### 3.1 Phase 1: 基础架构 (2周)

#### 目标
建立 Tauri + Node.js + SolidJS 的通信基础

#### 关键任务
1. **Tauri 项目初始化**
   - 创建 Tauri 项目骨架
   - 配置 macOS 专属权限 (文件系统、通知)
   - 设置开发和生产构建流程

2. **Node.js Backend 进程管理**
   - Rust 端启动和管理 Node.js 子进程
   - 处理进程生命周期 (启动、重启、关闭)
   - 错误捕获和日志记录

3. **IPC 通信层实现**
   - `IPCMessageAdapter` (Node.js ↔ Rust 通信)
   - `ipcService.ts` (SolidJS ↔ Rust 通信)
   - 消息序列化/反序列化
   - 请求/响应模式和事件模式

4. **DesktopUIFactory 和 DesktopInteractiveUI**
   - 实现 `UIFactory` 接口
   - 实现 `InteractiveUIInterface` 接口
   - 通过 IPC 适配所有 UI 方法

5. **基础 UI 布局**
   - 黑曜石黑主题 CSS 变量定义
   - 响应式布局框架
   - 通用组件库 (Button, Input, Modal)

#### 验证标准
- ✅ 前端能成功启动 Node.js 后端进程
- ✅ 前端能通过 IPC 发送消息到后端并收到响应
- ✅ 后端能通过 IPC 推送事件到前端
- ✅ 基础 UI 能正确渲染并应用黑曜石黑主题

---

### 3.2 Phase 2: 核心功能 (3周)

#### 3.2.1 聊天界面

**功能描述**
- 实时流式消息显示
- 用户消息输入和发送
- 工具调用可视化展示
- 思考内容展示
- 计算状态指示器

**技术实现**
- 复用 `StreamingQueryManager` 处理流式响应
- 复用 `MessageRouter` 构建查询参数
- 新增 `ChatView.tsx` 和 `chatStore.ts`
- 集成 Markdown 渲染 (markdown-it)

**关键文件**
- `src-ui/views/ChatView.tsx` - 聊天视图组件
- `src-ui/stores/chatStore.ts` - 聊天状态管理
- `src-ui/components/chat/MessageList.tsx` - 消息列表
- `src-ui/components/chat/InputBox.tsx` - 输入框
- `src-ui/components/chat/ToolUseDisplay.tsx` - 工具调用展示

#### 3.2.2 工作区管理

**功能描述**
- 创建/切换工作区
- 工作区配置管理
- 会话历史浏览
- 快照回退功能

**技术实现**
- 复用 `SessionManager` 管理会话持久化
- 复用 `CheckpointManager` 管理文件快照
- 新增 `WorkspaceView.tsx`

**关键文件**
- `src-ui/views/WorkspaceView.tsx` - 工作区管理视图
- `src-ui/stores/workspaceStore.ts` - 工作区状态
- 复用 `src/core/SessionManager.ts`
- 复用 `src/checkpoint/CheckpointManager.ts`

#### 3.2.3 权限管理 UI

**功能描述**
- 可视化权限请求弹窗
- 权限模式切换 (default/acceptEdits/bypassPermissions/plan)
- 权限历史记录
- 工具白名单/黑名单配置

**技术实现**
- 复用 `PermissionManager` 的权限逻辑
- 新增 `DesktopPermissionUI` 通过 IPC 请求权限
- 新增 `PermissionModal.tsx` 权限确认对话框

**关键文件**
- `src/ui/implementations/desktop/DesktopPermissionUI.ts` - 桌面权限 UI
- `src-ui/components/settings/PermissionSettings.tsx` - 权限设置界面
- `src-ui/components/common/PermissionModal.tsx` - 权限确认弹窗
- 复用 `src/permissions/PermissionManager.ts`

#### 3.2.4 文件修改预览

**功能描述**
- 可视化展示文件修改 (Diff)
- 支持语法高亮
- 支持折叠/展开代码块
- 支持审核和确认修改

**技术实现**
- 集成 CodeMirror 6 编辑器
- 使用 diff 库生成差异对比
- 新增 `FileDiff.tsx` 组件

**关键文件**
- `src-ui/components/files/FileDiff.tsx` - 文件 Diff 组件
- `src-ui/components/files/FilePreview.tsx` - 文件预览组件

#### 3.2.5 Checkpoint 恢复 UI

**功能描述**
- 快照列表展示
- 时间轴可视化
- 一键恢复到历史快照
- 差异预览

**技术实现**
- 复用 `CheckpointManager` 的快照机制
- 新增 `RewindMenu.tsx` 快照选择菜单

**关键文件**
- `src-ui/components/files/RewindMenu.tsx` - 快照菜单
- 复用 `src/checkpoint/CheckpointManager.ts`

#### 验证标准
- ✅ 能发送消息给 Claude 并实时显示流式响应
- ✅ 能创建和切换工作区
- ✅ 工具调用时能弹出权限确认对话框
- ✅ 文件修改时能显示可视化 Diff
- ✅ 能浏览和恢复历史快照

---

### 3.3 Phase 3: 高级功能 (3周)

#### 3.3.1 任务队列系统

**功能描述**
- 任务创建和队列管理
- 后台异步执行长任务
- 任务进度实时更新
- 任务中断和取消
- 任务完成通知

**技术实现**
- 新增 `TaskQueueManager.ts` 管理任务生命周期
- 扩展 `DesktopRunner` 支持任务上下文
- 任务状态持久化到 `SessionManager`
- 利用 macOS 原生通知

**关键文件**
- `src/desktop/TaskQueueManager.ts` - 任务队列管理器
- `src/runners/DesktopRunner.ts` - 桌面运行器 (扩展)
- `src-ui/views/TasksView.tsx` - 任务看板视图
- `src-ui/stores/taskStore.ts` - 任务状态管理

**数据模型**
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: any;
  error?: Error;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}
```

#### 3.3.2 文档解析能力 (通过 Skills 实现)

**设计理念**
参考 Claude Code 的架构设计,文档解析功能**不应内置在核心代码中**,而应通过 **Skills 系统**来实现。

**实现方式**
- **预置 Skills**: 提供一组预置的文档解析 Skills (PDF/Excel/Word/Image)
- **Skills 市场**: 用户可以从 Skills 市场下载额外的文档解析 Skills
- **自定义 Skills**: 用户可以编写自己的文档解析 Skills

**架构优势**
1. **核心简洁**: 避免在核心代码中引入大量文档解析依赖
2. **按需加载**: 用户只加载需要的文档解析能力
3. **易于扩展**: 新的文档格式通过新 Skill 支持,无需修改核心代码
4. **降低维护成本**: 文档解析逻辑独立维护

**预置 Skills 示例**
- `pdf-parser.skill.md` - PDF 文档解析 Skill
- `excel-parser.skill.md` - Excel 表格解析 Skill
- `word-parser.skill.md` - Word 文档解析 Skill
- `image-analyzer.skill.md` - 图像分析 Skill (基于 Vision API)

**Skills 位置**
- `src/extensibility/skills/document-parsers/` - 文档解析 Skills 集合

**使用方式**
用户可以通过以下方式启用文档解析:
1. 在 Skills 管理界面启用相关 Skills
2. 或者在项目 `.claude/skills/` 目录下添加 Skills 文件
3. Skills 会自动注册相应的文档处理能力到 Claude

#### 3.3.3 任务看板 UI

**功能描述**
- 任务卡片展示 (待办、进行中、已完成)
- 实时进度条
- 任务详情查看
- 任务操作 (取消、重试)
- 时间线可视化

**技术实现**
- 新增 `TaskBoard.tsx` 任务看板组件
- 卡片式布局 (参考 OpenWork)
- 实时订阅任务状态更新

**关键文件**
- `src-ui/components/tasks/TaskBoard.tsx` - 任务看板
- `src-ui/components/tasks/TaskCard.tsx` - 任务卡片
- `src-ui/components/tasks/ProgressBar.tsx` - 进度条

#### 3.3.4 macOS 原生通知

**功能描述**
- 任务完成通知
- 任务失败通知
- 权限请求通知 (可选)
- 通知点击跳转到相关任务

**技术实现**
- 新增 `SystemIntegrationService.ts` 系统集成服务
- 通过 Tauri Notification API 发送通知
- 处理通知点击事件

**关键文件**
- `src/desktop/SystemIntegrationService.ts` - 系统集成服务
- `src-tauri/src/notification.rs` - Rust 通知处理

#### 3.3.5 Skills 可视化管理

**功能描述**
- Skills 列表展示
- Skills 详情查看
- Skills 启用/禁用
- Skills 配置编辑
- Skills 市场 (未来扩展)

**技术实现**
- 复用现有 Skills 系统 (`.skill.md` 文件)
- 新增 `SkillsManager.tsx` 技能管理界面
- 支持文件选择器加载外部 Skills

**关键文件**
- `src-ui/components/settings/SkillsManager.tsx` - 技能管理界面
- `src-ui/stores/skillsStore.ts` - 技能状态管理
- 复用 `src/extensibility/skills/` 模块

#### 验证标准
- ✅ 能创建任务并在后台执行
- ✅ 任务看板能实时显示任务进度
- ✅ 能解析 PDF/Excel/Word 文档并提取内容
- ✅ 任务完成后能收到 macOS 原生通知
- ✅ 能在 UI 中浏览和管理 Skills

---

### 3.4 Phase 4: 优化与测试 (2周)

#### 3.4.1 性能优化

**优化项目**
1. **消息批处理**: 累积小消息,定时批量发送 (减少 IPC 开销)
2. **虚拟滚动**: 消息列表和任务列表使用虚拟滚动 (优化大数据渲染)
3. **流式传输**: 大文件分块传输 (避免内存溢出)
4. **本地缓存**: 前端缓存常用数据 (减少 IPC 调用)
5. **Worker Threads**: 文档解析和耗时操作使用 Worker (避免阻塞)

**关键指标**
- IPC 消息延迟 < 50ms
- 消息渲染帧率 > 30fps
- 文档解析速度 > 1MB/s

#### 3.4.2 错误处理与恢复

**错误场景**
1. Node.js 进程崩溃 → 自动重启 + 恢复会话
2. IPC 通信中断 → 重连机制 + 消息队列
3. Claude API 错误 → 友好错误提示 + 重试
4. 文档解析失败 → 降级到文本模式
5. 权限拒绝 → 清晰的权限说明

**恢复策略**
- 进程守护: 监控 Node.js 进程,崩溃自动重启
- 会话恢复: 从 SessionManager 恢复中断的会话
- 错误边界: SolidJS 错误边界捕获 UI 崩溃

#### 3.4.3 单元测试与集成测试

**测试范围**
1. IPC 通信层 (消息序列化、请求/响应)
2. TaskQueueManager (任务队列逻辑)
3. Skills 系统 (文档解析 Skills 加载和执行)
4. UI 组件 (快照测试)
5. 端到端测试 (消息发送 → 响应显示)

**测试工具**
- Jest (单元测试)
- Playwright (E2E 测试)
- fast-check (属性测试,复用现有)

#### 3.4.4 用户体验优化

**优化项目**
1. **快捷键支持**: Cmd+K (快速命令), Cmd+Enter (发送消息), Cmd+, (设置)
2. **加载状态**: 所有异步操作显示加载指示器
3. **空状态设计**: 首次使用的友好引导
4. **错误提示**: 清晰的错误信息和操作建议
5. **平滑动画**: 页面切换和组件动画

#### 3.4.5 打包与分发

**打包配置**
- Tauri 打包配置 (macOS .app 和 .dmg)
- 代码签名 (Apple Developer ID)
- 自动更新机制 (Tauri Updater)

**分发渠道**
- GitHub Releases
- 官方网站下载
- Homebrew Cask (可选)

#### 验证标准
- ✅ 所有核心功能测试覆盖率 > 80%
- ✅ E2E 测试通过
- ✅ 应用能正确打包为 .app 和 .dmg
- ✅ 无明显性能问题或内存泄漏

---

## 四、关键模块设计

### 4.1 Desktop UI Layer (新增)

#### 4.1.1 DesktopUIFactory
```typescript
/**
 * 文件: src/ui/factories/DesktopUIFactory.ts
 *
 * 功能: 桌面端 UI 工厂,创建 DesktopInteractiveUI 实例
 */
export class DesktopUIFactory implements UIFactory {
  constructor(private ipcAdapter: IPCMessageAdapter) {}

  createParser(): ParserInterface;
  createOutput(): OutputInterface;
  createPermissionUI(): PermissionUI;
  createInteractiveUI(
    callbacks: InteractiveUICallbacks,
    config?: InteractiveUIConfig
  ): InteractiveUIInterface;
}
```

#### 4.1.2 DesktopInteractiveUI
```typescript
/**
 * 文件: src/ui/implementations/desktop/DesktopInteractiveUI.ts
 *
 * 功能: 桌面端交互式 UI 实现,通过 IPC 与前端通信
 *
 * 核心方法:
 * - start(): 启动 IPC 监听,监听用户输入
 * - stop(): 停止 IPC 监听
 * - displayMessage(): 通过 IPC 推送消息到前端
 * - displayToolUse(): 通过 IPC 推送工具调用信息
 * - promptConfirmation(): 通过 IPC 请求用户确认
 */
```

#### 4.1.3 IPCMessageAdapter
```typescript
/**
 * 文件: src/ui/implementations/desktop/IPCMessageAdapter.ts
 *
 * 功能: IPC 消息适配器,封装 Tauri IPC 通信
 *
 * 核心方法:
 * - emit(event, payload): 发送事件 (单向)
 * - request<T>(event, payload): 发送请求 (需要响应)
 * - on(event, handler): 注册事件处理器
 * - off(event, handler): 取消事件监听
 */
```

**通信协议**
```typescript
interface IPCMessage {
  type: 'event' | 'request' | 'response';
  id?: number; // 请求 ID
  event: string;
  payload: any;
  error?: string;
}
```

---

### 4.2 Desktop Business Layer (新增)

#### 4.2.1 TaskQueueManager
```typescript
/**
 * 文件: src/desktop/TaskQueueManager.ts
 *
 * 功能: 任务队列管理器,支持后台异步执行任务
 *
 * 核心方法:
 * - enqueueTask(title, description, message, priority): 添加任务
 * - processQueue(): 处理任务队列
 * - listTasks(): 获取任务列表
 * - getTask(id): 获取任务详情
 * - cancelTask(id): 取消任务
 *
 * 核心逻辑:
 * 1. 按优先级插入队列 (high > medium > low)
 * 2. 单任务执行 (暂不支持并发)
 * 3. 任务进度实时通过 IPC 推送到前端
 * 4. 任务完成后发送 macOS 原生通知
 */
```

#### 4.2.2 SystemIntegrationService
```typescript
/**
 * 文件: src/desktop/SystemIntegrationService.ts
 *
 * 功能: 系统集成服务,提供 macOS 原生功能
 *
 * 核心方法:
 * - sendNotification(title, body, options): 发送原生通知
 * - selectFiles(options): 打开文件选择器
 * - selectFolder(): 打开文件夹选择器
 * - revealInFinder(filePath): 在 Finder 中显示文件
 * - getSystemInfo(): 获取系统信息
 */
```

---

### 4.3 Runner Layer 扩展

#### 4.3.1 DesktopRunner
```typescript
/**
 * 文件: src/runners/DesktopRunner.ts
 *
 * 功能: 桌面端运行器,继承 InteractiveRunner 并扩展桌面特性
 *
 * 新增能力:
 * - 集成 TaskQueueManager
 * - 集成 SystemIntegrationService
 * - 注册桌面端特有的 IPC 命令处理器
 *
 * 注意: 文档解析能力通过 Skills 系统实现,不在核心代码中集成
 */
```

---

### 4.4 Tauri Backend Layer (Rust)

#### 4.4.1 主进程 (main.rs)
```rust
// src-tauri/src/main.rs

// 核心功能:
// - 启动 Node.js 后端进程
// - 管理进程生命周期 (启动、重启、关闭)
// - IPC 桥接 (SolidJS ↔ Rust ↔ Node.js)
// - macOS 原生功能封装 (通知、文件选择器)

// 关键 Command:
// - start_node_backend(): 启动 Node.js 进程
// - send_to_node(message): 发送消息到 Node.js
// - send_notification(title, body): 发送原生通知
// - select_files(options): 打开文件选择器
// - select_folder(): 打开文件夹选择器
```

---

### 4.5 Frontend Layer (SolidJS)

#### 4.5.1 目录结构
```
src-ui/
├── components/
│   ├── common/           # 通用组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Notification.tsx
│   ├── chat/             # 聊天视图组件
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   ├── InputBox.tsx
│   │   ├── ToolUseDisplay.tsx
│   │   └── ThinkingIndicator.tsx
│   ├── tasks/            # 任务看板组件
│   │   ├── TaskBoard.tsx
│   │   ├── TaskCard.tsx
│   │   └── ProgressBar.tsx
│   ├── files/            # 文件管理组件
│   │   ├── FileExplorer.tsx
│   │   ├── FileDiff.tsx
│   │   ├── FilePreview.tsx
│   │   └── DocumentViewer.tsx
│   └── settings/         # 设置组件
│       ├── PermissionSettings.tsx
│       └── SkillsManager.tsx
├── views/                # 视图层
│   ├── DashboardView.tsx
│   ├── ChatView.tsx
│   ├── TasksView.tsx
│   ├── FilesView.tsx
│   └── SettingsView.tsx
├── stores/               # 状态管理 (SolidJS Signals)
│   ├── chatStore.ts
│   ├── taskStore.ts
│   ├── sessionStore.ts
│   ├── workspaceStore.ts
│   ├── skillsStore.ts
│   └── uiStore.ts
├── services/             # 服务层
│   ├── ipcService.ts     # IPC 通信服务
│   ├── notificationService.ts
│   └── fileService.ts
├── styles/               # 样式
│   ├── theme.css         # 黑曜石黑主题
│   └── global.css
├── App.tsx               # 根组件
└── main.tsx              # 入口文件
```

#### 4.5.2 IPC Service
```typescript
// src-ui/services/ipcService.ts

// 功能: 封装 Tauri IPC 通信,提供类型安全的 API

// 核心方法:
// - initialize(): 初始化 IPC 监听
// - emit(event, payload): 发送事件到 Node.js
// - request<T>(event, payload): 发送请求到 Node.js 并等待响应
// - on(event, handler): 监听来自 Node.js 的事件
// - off(event, handler): 取消事件监听
```

#### 4.5.3 Chat Store
```typescript
// src-ui/stores/chatStore.ts

// 功能: 聊天状态管理

// 状态:
// - messages: Signal<Message[]> - 消息列表
// - toolUses: Signal<ToolUse[]> - 工具调用列表
// - isComputing: Signal<boolean> - 是否正在计算
// - currentThinking: Signal<string | null> - 当前思考内容

// 方法:
// - sendMessage(message): 发送用户消息
// - interrupt(): 中断当前执行

// 自动订阅:
// - display_message: 新消息
// - display_tool_use: 工具调用
// - display_tool_result: 工具结果
// - display_computing: 开始计算
// - stop_computing: 停止计算
// - display_thinking: 思考内容
```

#### 4.5.4 Task Store
```typescript
// src-ui/stores/taskStore.ts

// 功能: 任务状态管理

// 状态:
// - tasks: Signal<Task[]> - 任务列表
// - currentTask: Signal<Task | null> - 当前执行的任务

// 方法:
// - createTask(title, description, message, priority): 创建任务
// - cancelTask(taskId): 取消任务
// - retryTask(taskId): 重试任务

// 自动订阅:
// - task_added: 任务已添加
// - task_started: 任务开始执行
// - task_progress: 任务进度更新
// - task_completed: 任务完成
// - task_failed: 任务失败
// - task_cancelled: 任务取消
```

---

## 五、数据流设计

### 5.1 用户消息流
```
User Input (SolidJS InputBox)
  → chatStore.sendMessage(message)
  → ipcService.emit('user_message', message)
  → Tauri IPC (invoke 'send_to_node')
  → Rust Bridge
  → Node.js Backend (stdin)
  → IPCMessageAdapter.handleIncomingMessage
  → DesktopInteractiveUI event handler
  → InteractiveRunner.handleUserMessage
  → StreamingQueryManager.sendMessage
  → MessageRouter.buildStreamMessage
  → SDKQueryExecutor.executeStreaming
  → Claude Agent SDK API Call

  ← Response Stream
  ← StreamingQueryManager callbacks
  ← DesktopInteractiveUI.displayMessage/displayToolUse
  ← IPCMessageAdapter.emit('display_message')
  ← Node.js Backend (stdout)
  ← Rust Bridge
  ← Tauri IPC (emit 'node_message')
  ← ipcService event handler
  ← chatStore listeners
  ← SolidJS Reactivity
  ← UI Re-render (MessageList)
```

### 5.2 任务队列流
```
User Action (Create Task)
  → taskStore.createTask(...)
  → ipcService.emit('enqueue_task', {...})
  → DesktopRunner IPC handler
  → TaskQueueManager.enqueueTask(...)
  → TaskQueueManager.processQueue()
  → InteractiveRunner.handleUserMessage (执行任务)

  ← Progress Updates
  ← TaskQueueManager.emit('task_progress', {...})
  ← taskStore listeners
  ← UI Progress Bar Update

  Task Completion
  → TaskQueueManager.emit('task_completed', {...})
  → SystemIntegrationService.sendNotification(...)
  → ipcService.request('send_notification', {...})
  → Tauri invoke('send_notification')
  → Rust Notification API
  → macOS Native Notification
```

### 5.3 文档解析流 (通过 Skills)
```
User Request (分析文档)
  → chatStore.sendMessage("请分析这个 PDF 文件")
  → ipcService.emit('user_message', message)
  → DesktopInteractiveUI
  → InteractiveRunner.handleUserMessage
  → Claude Agent SDK (with Skills enabled)

  Claude 决定使用文档解析 Skill
  → Skill 执行器调用相应的文档解析工具
  → 文档解析 (PDF/Excel/Word)
  ← 解析结果返回给 Claude
  ← Claude 分析文档内容并生成回复
  ← 通过 IPC 返回给前端
  ← UI 显示分析结果
```

### 5.4 权限请求流
```
Claude 工具调用请求
  → MessageRouter.createPermissionHandler
  → PermissionManager.createCanUseToolHandler
  → DesktopPermissionUI.promptForPermission(...)
  → IPCMessageAdapter.request('prompt_permission', {...})
  → ipcService event handler
  → Modal Component (Permission Confirmation)

  User Decision
  → Modal.onConfirm() / Modal.onReject()
  → ipcService.emit('permission_response', { allowed: boolean })
  → IPCMessageAdapter response handler
  ← Permission Decision
  ← PermissionManager.canUseTool returns boolean
  ← MessageRouter applies permission
  ← Tool execution allowed/denied
```

---

## 六、UI/UX 设计规范

### 6.1 黑曜石黑主题

#### 色彩系统
```css
/* src-ui/styles/theme.css */

:root {
  /* 主色调 - 黑曜石黑 */
  --color-bg-primary: #0d0d0d;        /* 主背景 */
  --color-bg-secondary: #1a1a1a;      /* 次级背景 */
  --color-bg-tertiary: #262626;       /* 三级背景 (卡片/面板) */
  --color-bg-elevated: #333333;       /* 悬浮背景 (模态框/下拉菜单) */

  /* 边框 */
  --color-border-subtle: #404040;     /* 微妙边框 */
  --color-border-default: #525252;    /* 默认边框 */
  --color-border-strong: #737373;     /* 强调边框 */

  /* 文本 */
  --color-text-primary: #f5f5f5;      /* 主文本 */
  --color-text-secondary: #d4d4d4;    /* 次级文本 */
  --color-text-tertiary: #a3a3a3;     /* 三级文本 (占位符/说明) */
  --color-text-disabled: #737373;     /* 禁用文本 */

  /* 强调色 */
  --color-accent-primary: #8b5cf6;    /* 紫色 - 主操作 */
  --color-accent-secondary: #ec4899;  /* 粉色 - 次级操作 */
  --color-accent-success: #10b981;    /* 绿色 - 成功 */
  --color-accent-warning: #f59e0b;    /* 橙色 - 警告 */
  --color-accent-error: #ef4444;      /* 红色 - 错误 */
  --color-accent-info: #3b82f6;       /* 蓝色 - 信息 */

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

#### 组件样式规范

**Button 组件**
- 5 种变体: primary, secondary, ghost, outline, danger
- 完整状态: default, hover, active, focus, disabled
- 激活态缩放: `active:scale-95`
- 平滑过渡: `transition-all duration-200`

**Input 组件**
- 深色背景: `bg-bg-tertiary`
- 聚焦边框: `focus:border-accent-primary`
- 占位符颜色: `placeholder:text-text-tertiary`

**Modal 组件**
- 背景遮罩: `rgba(0, 0, 0, 0.7)` + `backdrop-blur-sm`
- 模态框背景: `bg-bg-elevated`
- 阴影: `shadow-lg`
- 动画: 淡入 + 缩放

**Card 组件**
- 背景: `bg-bg-tertiary`
- 边框: `border-border-subtle`
- 圆角: `rounded-lg`
- 悬停: `hover:border-border-default`

### 6.2 布局规范

#### 多视图模式
参考 OpenWork 的三视图架构:
- **DashboardView**: 工作空间总览 (会话列表、任务看板、快速操作)
- **ChatView**: AI 对话界面 (消息列表、输入框、工具调用展示)
- **TasksView**: 任务管理界面 (任务看板、进度追踪、任务详情)
- **FilesView**: 文件管理界面 (文件浏览器、Diff 预览、快照恢复)
- **SettingsView**: 设置界面 (权限配置、Skills 管理、偏好设置)

#### 响应式布局
- 最小窗口尺寸: 1200x800
- 侧边栏宽度: 240px (可折叠)
- 主内容区: flex-grow
- 右侧面板: 360px (可选,用于详情展示)

### 6.3 交互规范

#### 快捷键
- `Cmd+K`: 快速命令面板
- `Cmd+Enter`: 发送消息
- `Cmd+,`: 打开设置
- `Cmd+N`: 新建会话
- `Cmd+W`: 关闭当前视图
- `Cmd+1/2/3/4/5`: 切换视图

#### 加载状态
- 全局加载: 顶部进度条 (NProgress)
- 局部加载: 骨架屏或 Spinner
- 流式加载: 打字机动画

#### 空状态
- 友好的插图 + 简短的引导文案
- 明确的操作按钮 (如 "创建第一个会话")

#### 错误提示
- Toast 通知 (右上角,3秒自动消失)
- 错误信息 + 操作建议 (如 "重试")
- 严重错误: Modal 对话框

---

## 七、技术难点与解决方案

### 7.1 IPC 性能问题

**问题**
高频消息可能导致 IPC 性能瓶颈 (例如流式消息每秒数十条)

**解决方案**
1. **消息批处理**: 累积 100ms 内的小消息,批量发送
2. **流式传输**: 大文件分块传输 (每块 64KB)
3. **本地缓存**: 前端缓存历史消息和任务数据,减少 IPC 调用
4. **虚拟滚动**: 消息列表使用虚拟滚动,只渲染可见区域

**关键代码**
```typescript
// 消息批处理示例
class MessageBatcher {
  private batch: IPCMessage[] = [];
  private timer: NodeJS.Timeout | null = null;

  add(message: IPCMessage) {
    this.batch.push(message);

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, 100); // 100ms
    }
  }

  flush() {
    if (this.batch.length > 0) {
      this.ipc.emit('batch_messages', { messages: this.batch });
      this.batch = [];
    }
    this.timer = null;
  }
}
```

---

### 7.2 任务中断与恢复

**问题**
后台任务执行中如何中断和恢复

**解决方案**
1. **复用 AbortController**: SDKQueryExecutor 已支持 AbortController
2. **任务状态持久化**: 任务状态保存到 SessionManager
3. **检查点机制**: 定期保存任务进度到文件
4. **幂等性设计**: 任务重试时保证幂等性 (不重复执行)

**关键代码**
```typescript
// 任务中断示例
class TaskQueueManager {
  private abortControllers = new Map<string, AbortController>();

  async executeTask(task: Task): Promise<any> {
    const controller = new AbortController();
    this.abortControllers.set(task.id, controller);

    try {
      const result = await this.sdkExecutor.executeStreaming({
        signal: controller.signal,
        // ...
      });
      return result;
    } finally {
      this.abortControllers.delete(task.id);
    }
  }

  cancelTask(taskId: string): boolean {
    const controller = this.abortControllers.get(taskId);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }
}
```

---

### 7.3 UI 状态同步

**问题**
多窗口或多视图之间的状态同步 (例如任务进度)

**解决方案**
1. **单一数据源**: 所有状态由 Node.js Backend 管理
2. **事件驱动**: 状态变化通过 IPC 事件广播到所有视图
3. **SolidJS Signals**: 自动响应式更新,无需手动刷新
4. **乐观更新**: 用户操作立即更新 UI,后台异步同步

**关键代码**
```typescript
// 乐观更新示例
const taskStore = {
  async createTask(title: string, description: string, message: string) {
    // 乐观更新: 立即添加到本地状态
    const tempTask: Task = {
      id: `temp-${Date.now()}`,
      title,
      description,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };
    setTasks(prev => [...prev, tempTask]);

    try {
      // 发送到后端
      const taskId = await ipcService.request('enqueue_task', {
        title,
        description,
        message,
      });

      // 替换临时 ID
      setTasks(prev => prev.map(t =>
        t.id === tempTask.id ? { ...t, id: taskId } : t
      ));
    } catch (error) {
      // 失败时回滚
      setTasks(prev => prev.filter(t => t.id !== tempTask.id));
      throw error;
    }
  },
};
```

---

## 八、关键文件路径总结

### 8.1 需要复用的核心文件 (100%)

**Business Layer**
- `src/core/MessageRouter.ts` - 消息路由核心
- `src/core/SessionManager.ts` - 会话管理核心
- `src/permissions/PermissionManager.ts` - 权限管理
- `src/checkpoint/CheckpointManager.ts` - 文件回滚
- `src/hooks/HookManager.ts` - 钩子管理
- `src/mcp/MCPService.ts` - MCP 协议集成

**SDK Layer**
- `src/sdk/SDKQueryExecutor.ts` - SDK 执行器
- `src/sdk/StreamingQueryManager.ts` - 流式查询管理

**Runner Layer**
- `src/runners/InteractiveRunner.ts` - 交互运行器 (作为基类)

**Extension Layer**
- `src/extensibility/skills/` - Skills 系统
- `src/custom-tools/` - Custom Tools 系统
- `src/agents/` - SubAgents 系统

**UI Contracts**
- `src/ui/contracts/core/UIFactory.ts` - UI 工厂接口
- `src/ui/contracts/interactive/InteractiveUIInterface.ts` - 交互 UI 接口
- `src/ui/contracts/core/PermissionUI.ts` - 权限 UI 接口

---

### 8.2 需要新增的核心文件

**Desktop UI Layer**
- `src/ui/factories/DesktopUIFactory.ts` - 桌面 UI 工厂
- `src/ui/implementations/desktop/DesktopInteractiveUI.ts` - 桌面交互 UI
- `src/ui/implementations/desktop/DesktopPermissionUI.ts` - 桌面权限 UI
- `src/ui/implementations/desktop/IPCMessageAdapter.ts` - IPC 消息适配器
- `src/ui/implementations/desktop/DesktopParser.ts` - 桌面参数解析器
- `src/ui/implementations/desktop/DesktopOutput.ts` - 桌面输出处理器

**Desktop Business Layer**
- `src/desktop/TaskQueueManager.ts` - 任务队列管理器
- `src/desktop/SystemIntegrationService.ts` - 系统集成服务

**注意**: 文档解析功能通过 Skills 实现,不在核心代码中添加 DocumentParserEngine

**Desktop Runner Layer**
- `src/runners/DesktopRunner.ts` - 桌面运行器

**Desktop Entry**
- `src/desktop-main.ts` - 桌面端入口文件

**Tauri Backend (Rust)**
- `src-tauri/src/main.rs` - Tauri 主进程
- `src-tauri/src/ipc.rs` - IPC 通信模块
- `src-tauri/src/notification.rs` - 通知模块
- `src-tauri/src/process.rs` - Node.js 进程管理
- `src-tauri/Cargo.toml` - Rust 依赖配置
- `src-tauri/tauri.conf.json` - Tauri 应用配置

**Frontend (SolidJS)**
- `src-ui/main.tsx` - 前端入口
- `src-ui/App.tsx` - 根组件
- `src-ui/services/ipcService.ts` - IPC 服务
- `src-ui/stores/chatStore.ts` - 聊天状态
- `src-ui/stores/taskStore.ts` - 任务状态
- `src-ui/stores/sessionStore.ts` - 会话状态
- `src-ui/stores/workspaceStore.ts` - 工作区状态
- `src-ui/stores/skillsStore.ts` - 技能状态
- `src-ui/stores/uiStore.ts` - UI 状态
- `src-ui/views/DashboardView.tsx` - 仪表板视图
- `src-ui/views/ChatView.tsx` - 聊天视图
- `src-ui/views/TasksView.tsx` - 任务视图
- `src-ui/views/FilesView.tsx` - 文件视图
- `src-ui/views/SettingsView.tsx` - 设置视图
- `src-ui/components/chat/MessageList.tsx` - 消息列表
- `src-ui/components/chat/InputBox.tsx` - 输入框
- `src-ui/components/chat/ToolUseDisplay.tsx` - 工具调用展示
- `src-ui/components/tasks/TaskBoard.tsx` - 任务看板
- `src-ui/components/tasks/TaskCard.tsx` - 任务卡片
- `src-ui/components/files/FileDiff.tsx` - 文件 Diff
- `src-ui/components/files/FilePreview.tsx` - 文件预览
- `src-ui/components/settings/PermissionSettings.tsx` - 权限设置
- `src-ui/components/settings/SkillsManager.tsx` - 技能管理
- `src-ui/styles/theme.css` - 黑曜石黑主题
- `src-ui/styles/global.css` - 全局样式

---

## 九、验证计划

### 9.1 Phase 1 验证 (基础架构)

**验证目标**
- Tauri + Node.js + SolidJS 通信链路畅通
- 基础 UI 正确渲染

**验证步骤**
1. 启动应用,检查 Node.js 进程是否成功启动
2. 前端点击 "测试连接" 按钮,发送 IPC 消息到后端
3. 后端接收消息后,通过 IPC 推送响应到前端
4. 前端显示响应内容 (成功消息)
5. 检查主题是否正确应用 (黑曜石黑)

**通过标准**
- ✅ 应用能正常启动,无错误日志
- ✅ IPC 双向通信延迟 < 100ms
- ✅ UI 主题符合设计规范

---

### 9.2 Phase 2 验证 (核心功能)

**验证目标**
- AI 对话功能完整
- 工作区和权限管理正常
- 文件修改预览和快照恢复可用

**验证步骤**

**聊天功能**
1. 在输入框输入 "Hello, Claude",点击发送
2. 检查消息是否正确显示在消息列表
3. 检查是否能收到 Claude 的流式响应
4. 检查工具调用是否正确展示 (如 Read 工具)
5. 检查思考内容是否正确显示

**工作区管理**
1. 点击 "新建工作区",选择一个文件夹
2. 检查工作区是否正确创建
3. 切换到另一个工作区,检查会话是否正确切换
4. 检查会话历史是否正确保存和加载

**权限管理**
1. 触发工具调用 (如 Edit 文件)
2. 检查是否弹出权限确认对话框
3. 点击 "允许一次",检查工具是否执行
4. 再次触发同一工具,检查是否再次请求权限
5. 切换到 "接受所有编辑" 模式,检查是否不再请求权限

**文件修改预览**
1. 让 Claude 修改一个文件
2. 检查是否显示 Diff 预览
3. 检查语法高亮是否正确
4. 检查是否能折叠/展开代码块

**快照恢复**
1. 触发文件修改 (创建快照)
2. 打开快照菜单,检查快照列表
3. 选择一个快照,点击恢复
4. 检查文件是否恢复到快照状态

**通过标准**
- ✅ 能正常发送消息并收到流式响应
- ✅ 工具调用正确展示
- ✅ 工作区切换无误
- ✅ 权限确认对话框正常弹出
- ✅ 文件 Diff 正确显示
- ✅ 快照恢复功能正常

---

### 9.3 Phase 3 验证 (高级功能)

**验证目标**
- 任务队列系统正常运行
- 通过 Skills 实现的文档解析功能正常
- macOS 原生通知正常
- Skills 管理功能可用

**验证步骤**

**任务队列**
1. 创建一个任务 "分析这个项目的代码结构"
2. 检查任务是否出现在任务看板
3. 检查任务状态是否正确更新 (pending → running)
4. 检查任务进度条是否实时更新
5. 等待任务完成,检查是否收到 macOS 通知
6. 检查任务状态是否变为 completed

**文档解析 (通过 Skills)**
1. 启用 PDF 解析 Skill
2. 让 Claude 分析一个 PDF 文件
3. 检查 Claude 是否能正确提取 PDF 内容
4. 启用 Excel 解析 Skill,测试 Excel 文件分析
5. 启用 Word 解析 Skill,测试 Word 文件分析

**macOS 通知**
1. 创建一个快速任务
2. 等待任务完成
3. 检查是否收到系统通知
4. 点击通知,检查是否跳转到任务详情

**Skills 管理**
1. 打开 Skills 管理界面
2. 检查是否列出所有可用 Skills
3. 点击一个 Skill,检查详情是否正确显示
4. 禁用一个 Skill,检查是否生效
5. 重新启用 Skill,检查是否恢复

**通过标准**
- ✅ 任务能正常创建、执行、完成
- ✅ 任务进度实时更新
- ✅ 通过 Skills 能正确解析 PDF/Excel/Word 文档
- ✅ 任务完成后能收到原生通知
- ✅ Skills 列表正确展示,启用/禁用功能正常

---

### 9.4 Phase 4 验证 (优化与测试)

**验证目标**
- 性能指标达标
- 错误处理正确
- 自动化测试通过
- 应用能正确打包

**验证步骤**

**性能测试**
1. 发送 100 条连续消息,检查 IPC 延迟 (应 < 50ms)
2. 加载包含 1000 条消息的会话,检查渲染帧率 (应 > 30fps)
3. 解析一个 50MB 的 PDF 文件,检查解析速度 (应 > 1MB/s)
4. 运行 10 分钟,检查内存占用 (应 < 500MB)

**错误处理测试**
1. 杀死 Node.js 进程,检查应用是否自动重启进程
2. 断开网络,触发 Claude API 调用,检查错误提示是否清晰
3. 上传一个损坏的 PDF 文件,检查是否降级到文本模式
4. 触发权限拒绝,检查提示信息是否明确

**自动化测试**
1. 运行单元测试: `npm test`
2. 运行集成测试: `npm run test:integration`
3. 运行 E2E 测试: `npm run test:e2e`
4. 检查测试覆盖率 (应 > 80%)

**打包测试**
1. 运行打包命令: `npm run tauri:build`
2. 检查是否生成 .app 文件
3. 检查是否生成 .dmg 文件
4. 在干净的 macOS 系统上安装并运行,检查是否正常工作

**通过标准**
- ✅ IPC 延迟 < 50ms
- ✅ 渲染帧率 > 30fps
- ✅ 文档解析速度 > 1MB/s
- ✅ 内存占用 < 500MB
- ✅ 进程崩溃能自动恢复
- ✅ 错误提示清晰友好
- ✅ 测试覆盖率 > 80%
- ✅ 打包成功,应用能正常运行

---

## 十、风险与缓解策略

### 10.1 风险列表

| 风险 | 级别 | 影响 | 缓解策略 |
|------|------|------|----------|
| IPC 性能瓶颈 | 高 | 用户体验差,消息延迟高 | 消息批处理,虚拟滚动,本地缓存 |
| Node.js 进程崩溃 | 高 | 应用不可用 | 进程守护,自动重启,会话恢复 |
| Skills 加载失败 | 中 | 部分功能不可用 | 降级提示,清晰错误提示,Skills 验证机制 |
| 权限管理复杂 | 中 | 用户困惑 | 清晰的权限说明,预设权限模式 |
| Tauri 打包问题 | 中 | 无法分发 | 充分测试,社区支持,备用方案 (Electron) |
| Claude API 限流 | 低 | 部分请求失败 | 重试机制,友好错误提示 |

### 10.2 技术债务管理

**已知技术债务**
1. 单任务执行 (暂不支持并发) → 未来扩展为多任务并发
2. 简化的 Onboarding (非完整引导) → 未来增加详细引导流程
3. 暂不支持 OCR (图像解析) → 未来集成 tesseract.js
4. 暂不支持办公软件集成 → 未来集成邮件/日历 API

**管理策略**
- 在代码中标记 TODO 注释
- 在 GitHub Issues 中跟踪技术债务
- 每个 Sprint 分配 20% 时间偿还技术债务

---

## 十一、项目里程碑

### 11.1 里程碑时间表

| 里程碑 | 目标日期 | 交付物 |
|--------|----------|--------|
| M1: 基础架构完成 | Week 2 | Tauri + Node.js + SolidJS 通信畅通,基础 UI 可用 |
| M2: 核心功能完成 | Week 5 | 聊天、工作区、权限、文件预览功能完整 |
| M3: 高级功能完成 | Week 8 | 任务队列、文档解析、Skills 管理功能完整 |
| M4: 优化与发布 | Week 10 | 性能优化完成,测试通过,应用可分发 |

### 11.2 成功标准

**MVP 成功标准**
- ✅ 100% 复用现有 Business 和 SDK 层代码
- ✅ AI 对话功能与 CLI 版本功能对等
- ✅ 权限管理系统完整且易用
- ✅ 任务队列支持后台异步执行
- ✅ 通过 Skills 系统支持文档解析 (PDF/Excel/Word)
- ✅ UI/UX 达到 OpenWork 水平
- ✅ macOS 原生集成 (通知、文件选择器)
- ✅ 性能指标达标 (IPC < 50ms, FPS > 30)
- ✅ 应用包体积 < 20MB (核心不包含文档解析依赖)

**用户验收标准**
- ✅ 5 名内部用户试用,满意度 > 4/5
- ✅ 无 P0/P1 级别 Bug
- ✅ 核心功能测试覆盖率 > 80%

---

## 十二、附录

### 12.1 技术参考

**Tauri**
- 官方文档: https://tauri.app/
- API 参考: https://tauri.app/v1/api/js/
- Rust 插件开发: https://tauri.app/v1/guides/features/plugin

**SolidJS**
- 官方文档: https://www.solidjs.com/
- Signals 教程: https://www.solidjs.com/tutorial/introduction_signals
- 最佳实践: https://www.solidjs.com/guides/getting-started

**Claude Agent SDK**
- GitHub: https://github.com/anthropics/claude-agent-sdk
- 文档: https://docs.anthropic.com/en/docs/agents

**文档解析库**
- pdf-parse: https://www.npmjs.com/package/pdf-parse
- xlsx: https://www.npmjs.com/package/xlsx
- mammoth: https://www.npmjs.com/package/mammoth
- sharp: https://sharp.pixelplumbing.com/

### 12.2 OpenWork 参考

**GitHub**
- https://github.com/different-ai/openwork

**关键参考点**
- 多视图模式 (Dashboard/Session/Onboarding)
- 权限管理 UI (清晰的权限说明和审批流程)
- 任务进度可视化 (时间线展示)
- Skills 可视化管理 (技能列表和配置)
- 现代简约设计风格

### 12.3 词汇表

| 术语 | 定义 |
|------|------|
| IPC | Inter-Process Communication,进程间通信 |
| SDK | Software Development Kit,软件开发工具包 |
| MVP | Minimum Viable Product,最小可行产品 |
| UX | User Experience,用户体验 |
| Diff | 文件差异对比 |
| OCR | Optical Character Recognition,光学字符识别 |
| E2E | End-to-End,端到端测试 |
| SOP | Standard Operating Procedure,标准操作流程 |

---

## 文档变更历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-01-20 | Claude Sonnet 4.5 | 初始版本,完整 PRD |

---

**文档结束**
