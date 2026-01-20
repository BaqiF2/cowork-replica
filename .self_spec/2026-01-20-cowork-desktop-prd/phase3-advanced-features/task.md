# 实施计划：Phase 3 高级功能

## 概述
实现任务队列系统、通过 Skills 实现文档解析、macOS 系统集成、任务看板 UI 和 Skills 可视化管理。

## Reference
- Design: [design.md](../design.md)
- Specification: [spec.md](./spec.md)

## 任务

### TaskQueueManager 核心实现 (任务组 1)

#### 包含场景
- Scenario: 创建并入队任务
- Scenario: 任务优先级排序
- Scenario: 单任务执行
- Scenario: 任务状态持久化
- Scenario: 任务进度追踪

#### 任务列表

- [ ] 1. [测试] 编写 TaskQueueManager 测试
   - 测试文件: `tests/desktop/TaskQueueManager.test.ts`
   - 测试任务创建、优先级排序、执行、持久化
   - _Requirements: 任务队列系统, TaskQueueManager 实现_
   - _Scenarios: 创建并入队任务, 任务优先级排序, 单任务执行, 任务状态持久化, 任务进度追踪_
   - _TaskGroup: 1_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- TaskQueueManager.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 1_

- [ ] 3. [实现] 实现 TaskQueueManager 类
   - 实现文件: `src/desktop/TaskQueueManager.ts`
   - 数据模型: Task 接口 (id, title, description, priority, status, progress, etc.)
   - 核心方法:
     - `enqueueTask(title, description, message, priority)`: 添加任务
     - `processQueue()`: 按优先级处理任务
     - `listTasks()`: 获取任务列表
     - `getTask(id)`: 获取任务详情
     - `cancelTask(id)`: 取消任务
     - `updateProgress(id, progress)`: 更新进度
   - 优先级排序: high > medium > low
   - 单任务执行 (暂不支持并发)
   - 任务状态持久化到 SessionManager
   - _Requirements: 任务队列系统, TaskQueueManager 实现_
   - _Scenarios: 创建并入队任务, 任务优先级排序, 单任务执行, 任务状态持久化, 任务进度追踪_
   - _TaskGroup: 1_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- TaskQueueManager.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 1_

- [ ] 5. [重构] 优化任务队列（可选）
   - 添加任务重试机制
   - 优化内存管理
   - _Requirements: 任务队列系统_
   - _TaskGroup: 1_

---

### 任务执行与生命周期 (任务组 2)

#### 包含场景
- Scenario: 后台异步执行任务
- Scenario: 任务成功完成
- Scenario: 任务执行失败
- Scenario: 取消正在执行的任务

#### 任务列表

- [ ] 1. [测试] 编写任务执行测试
   - 测试文件: `tests/desktop/task-execution.test.ts`
   - 测试后台执行、完成、失败、取消场景
   - _Requirements: 任务队列系统_
   - _Scenarios: 后台异步执行任务, 任务成功完成, 任务执行失败, 取消正在执行的任务_
   - _TaskGroup: 2_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- task-execution.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 2_

- [ ] 3. [实现] 实现任务执行逻辑
   - 扩展 TaskQueueManager:
     - `executeTask(task)`: 异步执行任务
     - 使用 AbortController 支持取消
     - 错误捕获和处理
     - 任务完成后调用 SystemIntegrationService 发送通知
   - 通过 IPC 推送任务状态变化事件
   - _Requirements: 任务队列系统_
   - _Scenarios: 后台异步执行任务, 任务成功完成, 任务执行失败, 取消正在执行的任务_
   - _TaskGroup: 2_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- task-execution.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 2_

- [ ] 5. [重构] 优化执行流程（可选）
   - 添加执行超时
   - 优化错误日志
   - _Requirements: 任务队列系统_
   - _TaskGroup: 2_

---

### SystemIntegrationService 实现 (任务组 3)

#### 包含场景
- Scenario: 发送 macOS 原生通知
- Scenario: 处理通知点击事件
- Scenario: 打开文件选择器
- Scenario: 打开文件夹选择器
- Scenario: 在 Finder 中显示文件

#### 任务列表

- [ ] 1. [测试] 编写 SystemIntegrationService 测试
   - 测试文件: `tests/desktop/SystemIntegrationService.test.ts`
   - 测试通知、文件选择器、Finder 集成
   - _Requirements: SystemIntegrationService 实现_
   - _Scenarios: 发送 macOS 原生通知, 处理通知点击事件, 打开文件选择器, 打开文件夹选择器, 在 Finder 中显示文件_
   - _TaskGroup: 3_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- SystemIntegrationService.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 3_

- [ ] 3. [实现] 实现 SystemIntegrationService 类
   - 实现文件: `src/desktop/SystemIntegrationService.ts`
   - 核心方法:
     - `sendNotification(title, body, options)`: 发送原生通知
     - `selectFiles(options)`: 打开文件选择器
     - `selectFolder()`: 打开文件夹选择器
     - `revealInFinder(filePath)`: 在 Finder 中显示文件
     - `getSystemInfo()`: 获取系统信息
   - 通过 IPC 调用 Tauri Notification 和 Dialog API
   - 处理通知点击事件
   - _Requirements: SystemIntegrationService 实现_
   - _Scenarios: 发送 macOS 原生通知, 处理通知点击事件, 打开文件选择器, 打开文件夹选择器, 在 Finder 中显示文件_
   - _TaskGroup: 3_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- SystemIntegrationService.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 3_

- [ ] 5. [重构] 优化系统集成（可选）
   - 添加错误重试
   - 优化通知样式
   - _Requirements: SystemIntegrationService 实现_
   - _TaskGroup: 3_

---

### Rust 通知和对话框实现 (任务组 4)

#### 包含场景
- Scenario: 发送 macOS 原生通知
- Scenario: 打开文件选择器
- Scenario: 打开文件夹选择器

#### 任务列表

- [ ] 1. [测试] 编写 Rust 系统集成测试
   - 测试文件: `src-tauri/tests/notification.test.rs`
   - 测试通知和对话框 Tauri 命令
   - _Requirements: SystemIntegrationService 实现_
   - _Scenarios: 发送 macOS 原生通知, 打开文件选择器, 打开文件夹选择器_
   - _TaskGroup: 4_

- [ ] 2. [验证] Red 阶段
   - 运行: `cargo test --manifest-path=src-tauri/Cargo.toml notification`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 4_

- [ ] 3. [实现] 实现 Rust 系统集成模块
   - 实现文件: `src-tauri/src/notification.rs`
   - Tauri 命令:
     - `send_notification(title, body)`: 调用 Tauri Notification API
     - `select_files(filters, multiple)`: 调用 Tauri Dialog API
     - `select_folder()`: 调用 Tauri Dialog API
     - `reveal_in_finder(path)`: 调用系统命令打开 Finder
   - 处理通知点击事件 (activate app window)
   - _Requirements: SystemIntegrationService 实现_
   - _Scenarios: 发送 macOS 原生通知, 打开文件选择器, 打开文件夹选择器_
   - _TaskGroup: 4_

- [ ] 4. [验证] Green 阶段
   - 运行: `cargo test --manifest-path=src-tauri/Cargo.toml notification`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 4_

- [ ] 5. [重构] 优化 Rust 集成（可选）
   - 优化错误处理
   - 添加日志记录
   - _Requirements: SystemIntegrationService 实现_
   - _TaskGroup: 4_

---

### 文档解析 Skills 实现 (任务组 5)

#### 包含场景
- Scenario: 启用文档解析 Skill
- Scenario: Claude 使用 Skill 解析 PDF
- Scenario: 解析 Excel 表格
- Scenario: 解析 Word 文档
- Scenario: 图像分析 (基于 Vision API)

#### 任务列表

- [ ] 1. [测试] 编写文档解析 Skills 测试
   - 测试文件: `tests/extensibility/skills/document-parsers.test.ts`
   - 测试 PDF/Excel/Word/Image Skills 加载和执行
   - _Requirements: 文档解析能力 (通过 Skills 实现)_
   - _Scenarios: 启用文档解析 Skill, Claude 使用 Skill 解析 PDF, 解析 Excel 表格, 解析 Word 文档, 图像分析_
   - _TaskGroup: 5_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- document-parsers.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 5_

- [ ] 3. [实现] 创建文档解析 Skills
   - Skill 文件:
     - `src/extensibility/skills/document-parsers/pdf-parser.skill.md`
     - `src/extensibility/skills/document-parsers/excel-parser.skill.md`
     - `src/extensibility/skills/document-parsers/word-parser.skill.md`
     - `src/extensibility/skills/document-parsers/image-analyzer.skill.md`
   - 每个 Skill 包含:
     - 功能描述
     - 工具定义 (调用文档解析库)
     - 用法示例
   - PDF: 使用 pdf-parse 库
   - Excel: 使用 xlsx 库
   - Word: 使用 mammoth 库
   - Image: 调用 Claude Vision API
   - _Requirements: 文档解析能力 (通过 Skills 实现)_
   - _Scenarios: 启用文档解析 Skill, Claude 使用 Skill 解析 PDF, 解析 Excel 表格, 解析 Word 文档, 图像分析_
   - _TaskGroup: 5_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- document-parsers.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 5_

- [ ] 5. [重构] 优化 Skills（可选）
   - 添加更多文档格式支持
   - 优化解析性能
   - _Requirements: 文档解析能力 (通过 Skills 实现)_
   - _TaskGroup: 5_

---

### taskStore 状态管理 (任务组 6)

#### 包含场景
- Scenario: 任务列表管理
- Scenario: 创建任务
- Scenario: 任务进度更新
- Scenario: 取消任务

#### 任务列表

- [ ] 1. [测试] 编写 taskStore 测试
   - 测试文件: `src-ui/stores/__tests__/taskStore.test.ts`
   - 测试 tasks, currentTask, createTask, cancelTask, 进度更新
   - _Requirements: taskStore 状态管理_
   - _Scenarios: 任务列表管理, 创建任务, 任务进度更新, 取消任务_
   - _TaskGroup: 6_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- taskStore.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 6_

- [ ] 3. [实现] 实现 taskStore 模块
   - 实现文件: `src-ui/stores/taskStore.ts`
   - 状态定义:
     - tasks: Signal<Task[]>
     - currentTask: Signal<Task | null>
   - 方法:
     - `createTask(title, description, message, priority)`: 创建任务
     - `cancelTask(taskId)`: 取消任务
     - `retryTask(taskId)`: 重试任务
   - 订阅 IPC 事件: task_added, task_started, task_progress, task_completed, task_failed, task_cancelled
   - 乐观更新
   - _Requirements: taskStore 状态管理_
   - _Scenarios: 任务列表管理, 创建任务, 任务进度更新, 取消任务_
   - _TaskGroup: 6_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- taskStore.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 6_

- [ ] 5. [重构] 优化 taskStore（可选）
   - 添加任务过滤
   - 优化状态同步
   - _Requirements: taskStore 状态管理_
   - _TaskGroup: 6_

---

### 任务看板 UI (任务组 7)

#### 包含场景
- Scenario: 任务看板布局
- Scenario: 任务卡片展示
- Scenario: 实时进度更新
- Scenario: 查看任务详情
- Scenario: 取消任务
- Scenario: 重试失败任务

#### 任务列表

- [ ] 1. [测试] 编写任务看板 UI 测试
   - 测试文件: `src-ui/views/__tests__/TasksView.test.tsx`
   - 测试看板布局、卡片展示、进度更新、详情查看
   - _Requirements: 任务看板 UI_
   - _Scenarios: 任务看板布局, 任务卡片展示, 实时进度更新, 查看任务详情, 取消任务, 重试失败任务_
   - _TaskGroup: 7_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- TasksView.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 7_

- [ ] 3. [实现] 实现任务看板 UI 组件
   - 实现文件:
     - `src-ui/views/TasksView.tsx`: 任务看板视图
     - `src-ui/components/tasks/TaskBoard.tsx`: 三栏看板布局
     - `src-ui/components/tasks/TaskCard.tsx`: 任务卡片
     - `src-ui/components/tasks/ProgressBar.tsx`: 进度条
   - 三栏布局: 待办 (pending)、进行中 (running)、已完成 (completed/failed/cancelled)
   - 任务卡片包含: 标题、描述、优先级、进度、时间
   - 实时进度更新 (订阅 taskStore)
   - 任务详情侧边栏
   - 取消和重试按钮
   - _Requirements: 任务看板 UI_
   - _Scenarios: 任务看板布局, 任务卡片展示, 实时进度更新, 查看任务详情, 取消任务, 重试失败任务_
   - _TaskGroup: 7_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- TasksView.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 7_

- [ ] 5. [重构] 优化任务看板（可选）
   - 添加拖拽排序
   - 优化动画效果
   - _Requirements: 任务看板 UI_
   - _TaskGroup: 7_

---

### skillsStore 状态管理 (任务组 8)

#### 包含场景
- Scenario: Skills 列表管理
- Scenario: 切换 Skill 启用状态

#### 任务列表

- [ ] 1. [测试] 编写 skillsStore 测试
   - 测试文件: `src-ui/stores/__tests__/skillsStore.test.ts`
   - 测试 skills, toggleSkill, loadSkills
   - _Requirements: skillsStore 状态管理_
   - _Scenarios: Skills 列表管理, 切换 Skill 启用状态_
   - _TaskGroup: 8_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- skillsStore.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 8_

- [ ] 3. [实现] 实现 skillsStore 模块
   - 实现文件: `src-ui/stores/skillsStore.ts`
   - 状态定义:
     - skills: Signal<Skill[]>
     - enabledSkills: Signal<Set<string>>
   - 方法:
     - `loadSkills()`: 加载 Skills 列表
     - `toggleSkill(skillId)`: 启用/禁用 Skill
     - `loadExternalSkill(filePath)`: 加载外部 Skill
   - 通过 IPC 与后端 Skills 系统通信
   - 本地存储持久化
   - _Requirements: skillsStore 状态管理_
   - _Scenarios: Skills 列表管理, 切换 Skill 启用状态_
   - _TaskGroup: 8_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- skillsStore.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 8_

- [ ] 5. [重构] 优化 skillsStore（可选）
   - 添加 Skills 搜索
   - 优化加载性能
   - _Requirements: skillsStore 状态管理_
   - _TaskGroup: 8_

---

### Skills 管理 UI (任务组 9)

#### 包含场景
- Scenario: 显示 Skills 列表
- Scenario: 查看 Skill 详情
- Scenario: 启用 Skill
- Scenario: 禁用 Skill
- Scenario: 加载外部 Skill

#### 任务列表

- [ ] 1. [测试] 编写 Skills 管理 UI 测试
   - 测试文件: `src-ui/components/settings/__tests__/SkillsManager.test.tsx`
   - 测试列表显示、详情查看、启用/禁用、外部加载
   - _Requirements: Skills 可视化管理_
   - _Scenarios: 显示 Skills 列表, 查看 Skill 详情, 启用 Skill, 禁用 Skill, 加载外部 Skill_
   - _TaskGroup: 9_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm test -- SkillsManager.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 9_

- [ ] 3. [实现] 实现 Skills 管理 UI 组件
   - 实现文件: `src-ui/components/settings/SkillsManager.tsx`
   - Skills 列表 (网格或列表布局)
   - 每个 Skill 卡片显示: 名称、描述、状态
   - Skill 详情面板
   - 启用/禁用开关
   - "加载外部 Skill" 按钮 (调用文件选择器)
   - 搜索和分类过滤
   - _Requirements: Skills 可视化管理_
   - _Scenarios: 显示 Skills 列表, 查看 Skill 详情, 启用 Skill, 禁用 Skill, 加载外部 Skill_
   - _TaskGroup: 9_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm test -- SkillsManager.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 9_

- [ ] 5. [重构] 优化 Skills UI（可选）
   - 添加 Skills 市场预览
   - 优化列表性能
   - _Requirements: Skills 可视化管理_
   - _TaskGroup: 9_

---

### Phase 3 端到端验证 (任务组 10)

#### 包含场景
- 所有 Phase 3 场景的集成验证

#### 任务列表

- [ ] 1. [测试] 编写 Phase 3 端到端测试
   - 测试文件: `tests/e2e/phase3-validation.test.ts`
   - 使用 Playwright 测试完整流程
   - 覆盖任务队列、文档解析、系统集成、Skills 管理
   - _Requirements: 所有 Phase 3 需求_
   - _TaskGroup: 10_

- [ ] 2. [验证] Red 阶段
   - 运行: `npm run test:e2e -- phase3-validation`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 10_

- [ ] 3. [实现] 集成所有 Phase 3 功能
   - 确保所有功能正确集成
   - 修复集成问题
   - _Requirements: 所有 Phase 3 需求_
   - _TaskGroup: 10_

- [ ] 4. [验证] Green 阶段
   - 运行: `npm run test:e2e -- phase3-validation`
   - 预期通过
   - 验证:
     - ✅ 任务能正常创建、执行、完成
     - ✅ 任务看板能实时显示任务进度
     - ✅ 通过 Skills 能正确解析 PDF/Excel/Word 文档
     - ✅ 任务完成后能收到 macOS 原生通知
     - ✅ 能在 UI 中浏览和管理 Skills
   - _Validates: 3_
   - _TaskGroup: 10_

- [ ] 5. [重构] 优化整体性能（可选）
   - 优化任务执行性能
   - 减少内存占用
   - _Requirements: 所有 Phase 3 需求_
   - _TaskGroup: 10_

---

## 总结

**总任务数**: 50 (10 个任务组 × 5 个任务)

**验收标准**:
- ✅ 任务能正常创建、执行、完成
- ✅ 任务看板能实时显示任务进度
- ✅ 通过 Skills 能正确解析 PDF/Excel/Word 文档
- ✅ 任务完成后能收到 macOS 原生通知
- ✅ 能在 UI 中浏览和管理 Skills
- ✅ 文档解析功能通过 Skills 实现,核心代码保持简洁
