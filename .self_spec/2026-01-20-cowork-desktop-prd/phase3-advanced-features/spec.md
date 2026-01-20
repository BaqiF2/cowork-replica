# Phase 3: 高级功能 - SelfSpec 规格说明

## ADDED Requirements

### Requirement: 任务队列系统
系统必须支持任务创建、队列管理、后台异步执行、进度追踪、中断取消和完成通知。

#### Scenario: 创建并入队任务
- **GIVEN** 用户在任务管理界面
- **WHEN** 用户创建任务 "分析项目代码结构" (优先级: high)
- **THEN** 应生成唯一任务 ID
- **AND** 任务状态应为 'pending'
- **AND** 任务应插入到队列中 (按优先级排序)
- **AND** 任务看板显示新任务

#### Scenario: 后台异步执行任务
- **GIVEN** 队列中有待处理任务
- **WHEN** 任务队列处理器启动
- **THEN** 应取出优先级最高的任务
- **AND** 将任务状态更新为 'running'
- **AND** 在后台异步执行任务
- **AND** 用户可以离开当前页面

#### Scenario: 任务进度实时更新
- **GIVEN** 任务正在执行
- **WHEN** 任务进度发生变化
- **THEN** 应通过 IPC 推送进度更新事件
- **AND** 前端任务看板实时更新进度条
- **AND** 显示当前执行步骤

#### Scenario: 任务成功完成
- **GIVEN** 任务正在执行
- **WHEN** 任务执行完成
- **THEN** 应将任务状态更新为 'completed'
- **AND** 记录完成时间和结果
- **AND** 发送 macOS 原生通知
- **AND** 通过 IPC 推送完成事件
- **AND** 处理队列中的下一个任务

#### Scenario: 任务执行失败
- **GIVEN** 任务正在执行
- **WHEN** 任务执行过程中发生错误
- **THEN** 应将任务状态更新为 'failed'
- **AND** 记录错误信息
- **AND** 发送失败通知
- **AND** 通过 IPC 推送失败事件

#### Scenario: 取消正在执行的任务
- **GIVEN** 任务正在执行
- **WHEN** 用户点击 "取消任务"
- **THEN** 应调用 AbortController.abort()
- **AND** 中断任务执行
- **AND** 将任务状态更新为 'cancelled'
- **AND** 通过 IPC 通知前端

---

### Requirement: 文档解析能力 (通过 Skills 实现)
系统必须通过 Skills 系统支持 PDF、Excel、Word 和图像文档的解析和分析。

#### Scenario: 启用文档解析 Skill
- **GIVEN** 用户在 Skills 管理界面
- **WHEN** 用户启用 "PDF Parser" Skill
- **THEN** 应加载 Skill 配置文件 (pdf-parser.skill.md)
- **AND** 注册 Skill 到 Claude Agent SDK
- **AND** Skill 状态显示为 "已启用"

#### Scenario: Claude 使用 Skill 解析 PDF
- **GIVEN** PDF Parser Skill 已启用
- **WHEN** 用户请求 "分析这个 PDF 文件的内容"
- **THEN** Claude 应决定调用 PDF Parser Skill
- **AND** Skill 执行器提取 PDF 文本和元数据
- **AND** 解析结果返回给 Claude
- **AND** Claude 基于内容生成分析报告

#### Scenario: 解析 Excel 表格
- **GIVEN** Excel Parser Skill 已启用
- **WHEN** 用户请求 "总结这个 Excel 表格的数据"
- **THEN** Claude 应调用 Excel Parser Skill
- **AND** Skill 提取工作表、单元格数据和公式
- **AND** 返回结构化数据给 Claude
- **AND** Claude 生成数据摘要

#### Scenario: 解析 Word 文档
- **GIVEN** Word Parser Skill 已启用
- **WHEN** 用户请求 "提取这个 Word 文档的标题和段落"
- **THEN** Claude 应调用 Word Parser Skill
- **AND** Skill 提取文档结构和内容
- **AND** 返回格式化文本给 Claude

#### Scenario: 图像分析 (基于 Vision API)
- **GIVEN** Image Analyzer Skill 已启用
- **WHEN** 用户请求 "描述这张截图的内容"
- **THEN** Claude 应调用 Image Analyzer Skill
- **AND** Skill 调用 Claude Vision API 分析图像
- **AND** 返回图像描述给 Claude

---

### Requirement: TaskQueueManager 实现
系统必须实现任务队列管理器,支持优先级排序、单任务执行和生命周期管理。

#### Scenario: 任务优先级排序
- **GIVEN** 队列中有多个任务 (high, medium, low)
- **WHEN** 新任务入队
- **THEN** 应按优先级插入队列 (high > medium > low)
- **AND** 同优先级按创建时间排序

#### Scenario: 单任务执行
- **GIVEN** 队列中有多个待处理任务
- **WHEN** 开始处理任务
- **THEN** 应一次只执行一个任务 (MVP 暂不支持并发)
- **AND** 前一个任务完成后才开始下一个

#### Scenario: 任务状态持久化
- **GIVEN** 任务队列管理器已启动
- **WHEN** 任务状态发生变化
- **THEN** 应将任务状态保存到 SessionManager
- **AND** 应用重启后能恢复任务列表

#### Scenario: 任务进度追踪
- **GIVEN** 任务正在执行
- **WHEN** 任务报告进度 (0-100)
- **THEN** 应更新任务进度字段
- **AND** 通过 IPC 推送进度事件到前端

---

### Requirement: SystemIntegrationService 实现
系统必须提供 macOS 原生功能集成,包括通知、文件选择器和系统信息获取。

#### Scenario: 发送 macOS 原生通知
- **GIVEN** SystemIntegrationService 已初始化
- **WHEN** 调用 `sendNotification('任务完成', '代码分析已完成')`
- **THEN** 应通过 Tauri Notification API 发送通知
- **AND** macOS 通知中心显示通知
- **AND** 通知包含标题、正文和应用图标

#### Scenario: 处理通知点击事件
- **GIVEN** macOS 通知已显示
- **WHEN** 用户点击通知
- **THEN** 应激活应用窗口
- **AND** 跳转到相关任务详情页面

#### Scenario: 打开文件选择器
- **GIVEN** SystemIntegrationService 已初始化
- **WHEN** 调用 `selectFiles({ filters: ['.pdf', '.txt'], multiple: true })`
- **THEN** 应通过 Tauri Dialog API 打开原生文件选择器
- **AND** 用户选择文件后返回文件路径数组

#### Scenario: 打开文件夹选择器
- **GIVEN** SystemIntegrationService 已初始化
- **WHEN** 调用 `selectFolder()`
- **THEN** 应打开原生文件夹选择器
- **AND** 用户选择文件夹后返回文件夹路径

#### Scenario: 在 Finder 中显示文件
- **GIVEN** 文件路径已知
- **WHEN** 调用 `revealInFinder('/path/to/file.txt')`
- **THEN** 应打开 Finder
- **AND** 定位并高亮显示目标文件

---

### Requirement: Skills 可视化管理
系统必须提供 Skills 列表展示、详情查看、启用/禁用和配置编辑功能。

#### Scenario: 显示 Skills 列表
- **GIVEN** 用户在 Skills 管理界面
- **WHEN** 界面加载
- **THEN** 应列出所有可用 Skills (包括预置和自定义)
- **AND** 每个 Skill 显示名称、描述、状态 (已启用/已禁用)
- **AND** 支持搜索和分类过滤

#### Scenario: 查看 Skill 详情
- **GIVEN** Skills 列表已显示
- **WHEN** 用户点击一个 Skill
- **THEN** 应显示 Skill 详情面板
- **AND** 包含完整描述、用法示例、依赖信息
- **AND** 显示 Skill 配置选项

#### Scenario: 启用 Skill
- **GIVEN** Skill 当前状态为 "已禁用"
- **WHEN** 用户点击 "启用"
- **THEN** 应加载 Skill 配置文件
- **AND** 注册 Skill 到 Claude Agent SDK
- **AND** 更新 Skill 状态为 "已启用"
- **AND** 通过 IPC 通知后端

#### Scenario: 禁用 Skill
- **GIVEN** Skill 当前状态为 "已启用"
- **WHEN** 用户点击 "禁用"
- **THEN** 应从 Claude Agent SDK 注销 Skill
- **AND** 更新 Skill 状态为 "已禁用"
- **AND** 通过 IPC 通知后端

#### Scenario: 加载外部 Skill
- **GIVEN** 用户在 Skills 管理界面
- **WHEN** 用户点击 "加载外部 Skill" 并选择 .skill.md 文件
- **THEN** 应验证 Skill 文件格式
- **AND** 添加到 Skills 列表
- **AND** 自动启用 Skill

---

### Requirement: 任务看板 UI
系统必须实现任务卡片展示、实时进度条、任务详情查看和任务操作功能。

#### Scenario: 任务看板布局
- **GIVEN** 用户在任务看板界面
- **WHEN** 界面加载
- **THEN** 应显示三栏布局: 待办、进行中、已完成
- **AND** 每栏显示对应状态的任务卡片
- **AND** 卡片按创建时间倒序排列

#### Scenario: 任务卡片展示
- **GIVEN** 任务看板已加载
- **WHEN** 显示任务卡片
- **THEN** 卡片应包含任务标题、描述摘要、优先级标签
- **AND** 显示进度条 (0-100%)
- **AND** 显示创建时间和状态图标

#### Scenario: 实时进度更新
- **GIVEN** 任务正在执行
- **WHEN** 后端推送进度更新事件
- **THEN** 任务卡片进度条应实时更新
- **AND** 显示当前进度百分比
- **AND** 动画平滑过渡

#### Scenario: 查看任务详情
- **GIVEN** 任务看板已加载
- **WHEN** 用户点击任务卡片
- **THEN** 应显示任务详情侧边栏
- **AND** 包含完整描述、执行日志、结果输出
- **AND** 显示任务时间线 (创建、开始、完成)

#### Scenario: 取消任务
- **GIVEN** 任务正在执行
- **WHEN** 用户在任务详情中点击 "取消"
- **THEN** 应通过 IPC 发送取消请求
- **AND** 任务状态更新为 'cancelled'
- **AND** 任务卡片移动到 "已完成" 栏

#### Scenario: 重试失败任务
- **GIVEN** 任务状态为 'failed'
- **WHEN** 用户点击 "重试"
- **THEN** 应创建新任务 (复制原任务配置)
- **AND** 新任务入队并开始执行

---

### Requirement: skillsStore 状态管理
系统必须使用 SolidJS Signals 管理 Skills 列表、启用状态和配置。

#### Scenario: Skills 列表管理
- **GIVEN** skillsStore 已初始化
- **WHEN** 加载 Skills 列表
- **THEN** 应更新 skills Signal
- **AND** 从文件系统和后端加载 Skills
- **AND** 自动触发 UI 更新

#### Scenario: 切换 Skill 启用状态
- **GIVEN** skillsStore 已初始化
- **WHEN** 调用 `skillsStore.toggleSkill(skillId)`
- **THEN** 应更新 Skill 启用状态
- **AND** 通过 IPC 通知后端
- **AND** 持久化状态到本地存储

---

### Requirement: taskStore 状态管理
系统必须使用 SolidJS Signals 管理任务列表、当前任务和任务进度。

#### Scenario: 任务列表管理
- **GIVEN** taskStore 已初始化
- **WHEN** 接收到任务列表数据
- **THEN** 应更新 tasks Signal
- **AND** 按状态分组任务
- **AND** 自动触发任务看板 UI 更新

#### Scenario: 创建任务
- **GIVEN** taskStore 已初始化
- **WHEN** 调用 `taskStore.createTask(title, description, message, priority)`
- **THEN** 应乐观更新 tasks Signal (添加临时任务)
- **AND** 通过 IPC 发送创建请求
- **AND** 收到后端响应后更新任务 ID

#### Scenario: 任务进度更新
- **GIVEN** taskStore 已订阅 IPC 事件
- **WHEN** 接收到 task_progress 事件
- **THEN** 应更新对应任务的 progress 字段
- **AND** 自动触发进度条 UI 更新

#### Scenario: 取消任务
- **GIVEN** 任务正在执行
- **WHEN** 调用 `taskStore.cancelTask(taskId)`
- **THEN** 应通过 IPC 发送取消请求
- **AND** 乐观更新任务状态为 'cancelled'
