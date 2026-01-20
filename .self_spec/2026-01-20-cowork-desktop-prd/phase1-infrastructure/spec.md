# Phase 1: 基础架构 - SelfSpec 规格说明

## ADDED Requirements

### Requirement: Tauri 项目初始化
系统必须创建完整的 Tauri 项目骨架，配置 macOS 专属权限，并设置开发和生产构建流程。

#### Scenario: 创建 Tauri 项目结构
- **GIVEN** 项目根目录存在
- **WHEN** 执行 Tauri 初始化命令
- **THEN** 应当生成标准 Tauri 项目结构
- **AND** `src-tauri/` 目录包含 `src/main.rs`、`Cargo.toml`、`tauri.conf.json`
- **AND** 项目配置文件包含 macOS 文件系统和通知权限声明

#### Scenario: 配置开发构建流程
- **GIVEN** Tauri 项目已初始化
- **WHEN** 执行 `npm run tauri:dev` 命令
- **THEN** 应当成功启动开发服务器
- **AND** 应用窗口正确显示
- **AND** 热重载功能正常工作

#### Scenario: 配置生产构建流程
- **GIVEN** Tauri 项目已初始化
- **WHEN** 执行 `npm run tauri:build` 命令
- **THEN** 应当生成 macOS .app 文件
- **AND** 应用能在 macOS 系统上正常运行

---

### Requirement: Node.js Backend 进程管理
系统必须在 Rust 端启动和管理 Node.js 子进程，处理进程生命周期，并捕获错误日志。

#### Scenario: 启动 Node.js 子进程
- **GIVEN** Tauri 应用已启动
- **WHEN** 执行 `start_node_backend` 命令
- **THEN** 应当成功启动 Node.js 进程
- **AND** 进程通过 stdin/stdout 与 Rust 通信
- **AND** 进程 ID 被正确记录

#### Scenario: 处理 Node.js 进程崩溃
- **GIVEN** Node.js 进程正在运行
- **WHEN** Node.js 进程异常退出
- **THEN** 应当捕获退出信号和错误日志
- **AND** 自动重启 Node.js 进程
- **AND** 通过 IPC 通知前端进程重启事件

#### Scenario: 优雅关闭 Node.js 进程
- **GIVEN** Node.js 进程正在运行
- **WHEN** Tauri 应用关闭
- **THEN** 应当发送 SIGTERM 信号到 Node.js 进程
- **AND** 等待进程优雅退出 (最多 5 秒)
- **AND** 超时后强制终止进程

---

### Requirement: IPC 通信层实现
系统必须实现三层 IPC 通信机制：SolidJS ↔ Rust ↔ Node.js，支持请求/响应模式和事件模式。

#### Scenario: Node.js 到 Rust 的消息发送
- **GIVEN** IPCMessageAdapter 已初始化
- **WHEN** Node.js 调用 `adapter.emit('event_name', payload)`
- **THEN** 应当序列化消息为 JSON 格式
- **AND** 通过 stdout 发送到 Rust 进程
- **AND** Rust 进程接收并解析消息

#### Scenario: Rust 到 SolidJS 的事件推送
- **GIVEN** Rust IPC 桥接已启动
- **WHEN** 接收到 Node.js 的 stdout 消息
- **THEN** 应当解析消息内容
- **AND** 通过 Tauri emit API 推送到前端
- **AND** SolidJS ipcService 接收并触发相应事件处理器

#### Scenario: SolidJS 到 Node.js 的请求/响应
- **GIVEN** IPC 通信链路已建立
- **WHEN** SolidJS 调用 `ipcService.request('command', payload)`
- **THEN** 应当生成唯一请求 ID
- **AND** 通过 Tauri invoke 发送到 Rust
- **AND** Rust 转发到 Node.js stdin
- **AND** Node.js 处理后通过 stdout 返回响应
- **AND** Rust 通过 emit 推送响应到 SolidJS
- **AND** SolidJS 根据请求 ID 匹配并返回 Promise 结果

#### Scenario: 消息序列化和反序列化
- **GIVEN** IPC 消息需要传输
- **WHEN** 发送包含复杂对象的消息
- **THEN** 应当正确序列化为 JSON
- **AND** 接收端能正确反序列化
- **AND** Error 对象被转换为可序列化格式
- **AND** Date 对象被转换为 ISO 字符串

---

### Requirement: DesktopUIFactory 实现
系统必须实现 UIFactory 接口，创建桌面端专属的 UI 组件实例。

#### Scenario: 创建 DesktopUIFactory 实例
- **GIVEN** IPCMessageAdapter 已初始化
- **WHEN** 调用 `new DesktopUIFactory(ipcAdapter)`
- **THEN** 应当成功创建工厂实例
- **AND** ipcAdapter 被正确注入

#### Scenario: 创建 InteractiveUI 实例
- **GIVEN** DesktopUIFactory 已创建
- **WHEN** 调用 `factory.createInteractiveUI(callbacks, config)`
- **THEN** 应当返回 DesktopInteractiveUI 实例
- **AND** 实例实现所有 InteractiveUIInterface 方法
- **AND** callbacks 被正确绑定

#### Scenario: 创建其他 UI 组件
- **GIVEN** DesktopUIFactory 已创建
- **WHEN** 调用 `createParser()`、`createOutput()`、`createPermissionUI()`
- **THEN** 应当返回对应的桌面端实现
- **AND** 所有实例通过 ipcAdapter 与前端通信

---

### Requirement: DesktopInteractiveUI 实现
系统必须实现 InteractiveUIInterface 接口的所有 26 个方法，通过 IPC 与前端通信。

#### Scenario: 启动和停止 IPC 监听
- **GIVEN** DesktopInteractiveUI 实例已创建
- **WHEN** 调用 `ui.start()`
- **THEN** 应当注册 IPC 事件监听器
- **AND** 开始监听用户输入事件
- **WHEN** 调用 `ui.stop()`
- **THEN** 应当取消所有 IPC 监听器
- **AND** 清理资源

#### Scenario: 显示消息到前端
- **GIVEN** DesktopInteractiveUI 已启动
- **WHEN** 调用 `ui.displayMessage('Hello', { role: 'assistant' })`
- **THEN** 应当通过 IPC 发送 `display_message` 事件
- **AND** 事件 payload 包含消息内容和角色信息
- **AND** 前端消息列表更新

#### Scenario: 显示工具调用
- **GIVEN** DesktopInteractiveUI 已启动
- **WHEN** 调用 `ui.displayToolUse(toolUseData)`
- **THEN** 应当通过 IPC 发送 `display_tool_use` 事件
- **AND** 事件包含工具名称、参数、状态信息
- **AND** 前端工具调用组件更新

#### Scenario: 请求用户确认
- **GIVEN** DesktopInteractiveUI 已启动
- **WHEN** 调用 `ui.promptConfirmation(message, options)`
- **THEN** 应当通过 IPC 请求发送确认请求
- **AND** 前端显示确认对话框
- **AND** 返回 Promise 等待用户响应
- **AND** 用户点击确认/取消后 Promise resolve

---

### Requirement: 基础 UI 布局实现
系统必须实现黑曜石黑主题的响应式 UI 布局和通用组件库。

#### Scenario: 定义黑曜石黑主题 CSS 变量
- **GIVEN** 主题文件 `src-ui/styles/theme.css` 存在
- **WHEN** 加载主题样式
- **THEN** 应当定义所有颜色变量 (bg-primary, bg-secondary, text-primary 等)
- **AND** 应当定义圆角变量 (radius-sm, radius-md, radius-lg, radius-xl)
- **AND** 应当定义间距变量 (spacing-xs 到 spacing-xl)
- **AND** 应当定义阴影变量 (shadow-sm, shadow-md, shadow-lg)

#### Scenario: 响应式布局框架
- **GIVEN** 应用主布局组件已创建
- **WHEN** 窗口尺寸为 1200x800 (最小尺寸)
- **THEN** 侧边栏宽度应为 240px
- **AND** 主内容区应使用 flex-grow 自适应
- **AND** 所有元素正确显示无溢出

#### Scenario: 通用组件库
- **GIVEN** 组件库已实现
- **WHEN** 导入 Button、Input、Modal 组件
- **THEN** 应当正确渲染组件
- **AND** Button 支持 5 种变体 (primary, secondary, ghost, outline, danger)
- **AND** Input 支持聚焦边框高亮
- **AND** Modal 支持背景遮罩和淡入动画

---

### Requirement: IPCMessageAdapter 实现
系统必须实现 IPC 消息适配器，封装底层通信细节，提供统一的消息传递接口。

#### Scenario: 发送单向事件
- **GIVEN** IPCMessageAdapter 已初始化
- **WHEN** 调用 `adapter.emit('event_name', { data: 'value' })`
- **THEN** 应当构造 IPCMessage 对象 (type: 'event')
- **AND** 序列化为 JSON 并通过 stdout 发送
- **AND** 不等待响应直接返回

#### Scenario: 发送请求并等待响应
- **GIVEN** IPCMessageAdapter 已初始化
- **WHEN** 调用 `adapter.request<T>('command', payload)`
- **THEN** 应当生成唯一请求 ID
- **AND** 构造 IPCMessage 对象 (type: 'request')
- **AND** 返回 Promise 并注册响应处理器
- **AND** 收到匹配 ID 的响应后 resolve Promise
- **AND** 超时 (30 秒) 后 reject Promise

#### Scenario: 注册和取消事件监听
- **GIVEN** IPCMessageAdapter 已初始化
- **WHEN** 调用 `adapter.on('event_name', handler)`
- **THEN** 应当注册事件处理器
- **AND** 接收到匹配事件时调用 handler
- **WHEN** 调用 `adapter.off('event_name', handler)`
- **THEN** 应当取消该处理器
- **AND** 后续事件不再触发该 handler

---

### Requirement: SolidJS ipcService 实现
系统必须在 SolidJS 前端实现 IPC 通信服务，封装 Tauri API 调用。

#### Scenario: 初始化 IPC 监听
- **GIVEN** SolidJS 应用已启动
- **WHEN** 调用 `ipcService.initialize()`
- **THEN** 应当使用 Tauri listen API 监听 Node.js 事件
- **AND** 注册消息路由器
- **AND** 启动心跳检测

#### Scenario: 发送事件到后端
- **GIVEN** ipcService 已初始化
- **WHEN** 调用 `ipcService.emit('user_message', message)`
- **THEN** 应当使用 Tauri invoke API 调用 `send_to_node` 命令
- **AND** 传递序列化的消息对象
- **AND** 不等待响应

#### Scenario: 发送请求并等待响应
- **GIVEN** ipcService 已初始化
- **WHEN** 调用 `ipcService.request<T>('get_tasks', {})`
- **THEN** 应当生成唯一请求 ID
- **AND** 使用 Tauri invoke 发送请求
- **AND** 返回 Promise
- **AND** 收到响应后根据 ID 匹配并 resolve
- **AND** 超时后 reject

#### Scenario: 监听来自后端的事件
- **GIVEN** ipcService 已初始化
- **WHEN** 调用 `ipcService.on('display_message', handler)`
- **THEN** 应当注册事件处理器
- **AND** 后端推送 `display_message` 事件时调用 handler
- **AND** 传递事件 payload

---

### Requirement: 验证基础架构
系统必须验证 Tauri + Node.js + SolidJS 通信链路畅通，基础 UI 正确渲染。

#### Scenario: 前端启动后端进程
- **GIVEN** Tauri 应用已启动
- **WHEN** 前端调用启动后端命令
- **THEN** Node.js 进程应成功启动
- **AND** 进程 ID 被记录
- **AND** 前端收到启动成功事件

#### Scenario: 双向 IPC 通信测试
- **GIVEN** 前端和后端进程都已启动
- **WHEN** 前端发送测试消息 "ping"
- **THEN** 后端应收到消息
- **AND** 后端返回响应 "pong"
- **AND** 前端收到响应
- **AND** 整个过程延迟 < 100ms

#### Scenario: 后端主动推送事件
- **GIVEN** IPC 通信链路已建立
- **WHEN** 后端调用 `adapter.emit('test_event', { message: 'hello' })`
- **THEN** Rust 进程应接收并转发事件
- **AND** SolidJS ipcService 应触发事件处理器
- **AND** 前端 UI 更新

#### Scenario: 基础 UI 渲染验证
- **GIVEN** 应用已启动
- **WHEN** 加载主界面
- **THEN** 应当应用黑曜石黑主题
- **AND** 所有 CSS 变量正确生效
- **AND** 布局无错位或溢出
- **AND** 通用组件 (Button, Input, Modal) 正确渲染
