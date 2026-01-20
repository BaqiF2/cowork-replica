# 实施计划：Phase 1 基础架构

## 概述
建立 Tauri + Node.js + SolidJS 的三层通信基础，实现 IPC 消息传递、进程管理和基础 UI 框架。

## Reference
- Design: [design.md](../design.md)
- Specification: [spec.md](./spec.md)

## 任务

### Tauri 项目初始化与配置 (任务组 1)

#### 包含场景
- Scenario: 创建 Tauri 项目结构
- Scenario: 配置开发构建流程
- Scenario: 配置生产构建流程

#### 任务列表

- [x] 1. [测试] 编写 Tauri 项目初始化测试
   - 测试文件: `tests/tauri-setup.test.ts`
   - 验证项目结构、配置文件、构建流程
   - _Requirements: Tauri 项目初始化_
   - _Scenarios: 创建 Tauri 项目结构, 配置开发构建流程, 配置生产构建流程_
   - _TaskGroup: 1_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- tauri-setup.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 1_

- [x] 3. [实现] 初始化 Tauri 项目
   - 执行: `npm create tauri-app@latest`
   - 配置文件: `src-tauri/tauri.conf.json`
   - 添加 macOS 权限: 文件系统、通知
   - 配置脚本: `package.json` 中添加 `tauri:dev` 和 `tauri:build`
   - _Requirements: Tauri 项目初始化_
   - _Scenarios: 创建 Tauri 项目结构, 配置开发构建流程, 配置生产构建流程_
   - _TaskGroup: 1_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- tauri-setup.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 1_

- [x] 5. [重构] 优化配置文件（可选）
   - 提取环境变量配置
   - 添加构建优化选项
   - _Requirements: Tauri 项目初始化_
   - _TaskGroup: 1_

---

### Node.js 进程管理 (任务组 2)

#### 包含场景
- Scenario: 启动 Node.js 子进程
- Scenario: 处理 Node.js 进程崩溃
- Scenario: 优雅关闭 Node.js 进程

#### 任务列表

- [x] 1. [测试] 编写进程管理测试
   - 测试文件: `src-tauri/tests/process_test.rs`
   - 覆盖进程启动、崩溃恢复、优雅关闭场景
   - _Requirements: Node.js Backend 进程管理_
   - _Scenarios: 启动 Node.js 子进程, 处理 Node.js 进程崩溃, 优雅关闭 Node.js 进程_
   - _TaskGroup: 2_

- [x] 2. [验证] Red 阶段
   - 运行: `cargo test --manifest-path=src-tauri/Cargo.toml`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 2_

- [x] 3. [实现] 实现进程管理模块
   - 实现文件: `src-tauri/src/process.rs`
   - 功能:
     - `start_node_backend()`: 启动 Node.js 进程
     - `restart_on_crash()`: 监控并自动重启
     - `shutdown_gracefully()`: 发送 SIGTERM 并等待退出
   - 配置环境变量和工作目录
   - _Requirements: Node.js Backend 进程管理_
   - _Scenarios: 启动 Node.js 子进程, 处理 Node.js 进程崩溃, 优雅关闭 Node.js 进程_
   - _TaskGroup: 2_

- [x] 4. [验证] Green 阶段
   - 运行: `cargo test --manifest-path=src-tauri/Cargo.toml`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 2_

- [x] 5. [重构] 优化进程管理（可选）
   - 添加进程健康检查
   - 优化日志记录
   - _Requirements: Node.js Backend 进程管理_
   - _TaskGroup: 2_

---

### IPC 消息序列化和协议定义 (任务组 3)

#### 包含场景
- Scenario: 消息序列化和反序列化

#### 任务列表

- [x] 1. [测试] 编写消息序列化测试
   - 测试文件: `tests/ipc/message-serialization.test.ts`
   - 测试复杂对象、Error、Date 的序列化
   - _Requirements: IPC 通信层实现_
   - _Scenarios: 消息序列化和反序列化_
   - _TaskGroup: 3_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- message-serialization.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 3_

- [x] 3. [实现] 实现消息序列化模块
   - 实现文件: `src/ui/implementations/desktop/MessageSerializer.ts`
   - 定义 IPCMessage 接口
   - 实现序列化/反序列化函数
   - 处理特殊类型 (Error, Date)
   - _Requirements: IPC 通信层实现_
   - _Scenarios: 消息序列化和反序列化_
   - _TaskGroup: 3_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- message-serialization.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 3_

- [x] 5. [重构] 优化序列化性能（可选）
   - 使用更高效的序列化库
   - 添加缓存机制
   - _Requirements: IPC 通信层实现_
   - _TaskGroup: 3_

---

### IPCMessageAdapter 实现 (任务组 4)

#### 包含场景
- Scenario: 发送单向事件
- Scenario: 发送请求并等待响应
- Scenario: 注册和取消事件监听

#### 任务列表

- [x] 1. [测试] 编写 IPCMessageAdapter 测试
   - 测试文件: `tests/ui/implementations/desktop/IPCMessageAdapter.test.ts`
   - 覆盖 emit、request、on、off 方法
   - _Requirements: IPCMessageAdapter 实现_
   - _Scenarios: 发送单向事件, 发送请求并等待响应, 注册和取消事件监听_
   - _TaskGroup: 4_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- IPCMessageAdapter.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 4_

- [x] 3. [实现] 实现 IPCMessageAdapter 类
   - 实现文件: `src/ui/implementations/desktop/IPCMessageAdapter.ts`
   - 核心方法:
     - `emit(event, payload)`: 发送单向事件
     - `request<T>(event, payload)`: 请求/响应模式
     - `on(event, handler)`: 注册监听器
     - `off(event, handler)`: 取消监听器
   - 管理请求 ID 和 Promise 映射
   - 实现超时机制 (30 秒)
   - _Requirements: IPCMessageAdapter 实现_
   - _Scenarios: 发送单向事件, 发送请求并等待响应, 注册和取消事件监听_
   - _TaskGroup: 4_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- IPCMessageAdapter.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 4_

- [x] 5. [重构] 优化 IPCMessageAdapter（可选）
   - 添加消息批处理
   - 优化内存管理
   - _Requirements: IPCMessageAdapter 实现_
   - _TaskGroup: 4_

---

### Rust IPC 桥接实现 (任务组 5)

#### 包含场景
- Scenario: Node.js 到 Rust 的消息发送
- Scenario: Rust 到 SolidJS 的事件推送

#### 任务列表

- [x] 1. [测试] 编写 Rust IPC 桥接测试
   - 测试文件: `src-tauri/tests/ipc_test.rs`
   - 测试 stdin/stdout 消息传递和 Tauri emit
   - _Requirements: IPC 通信层实现_
   - _Scenarios: Node.js 到 Rust 的消息发送, Rust 到 SolidJS 的事件推送_
   - _TaskGroup: 5_

- [x] 2. [验证] Red 阶段
   - 运行: `cargo test --manifest-path=src-tauri/Cargo.toml ipc`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 5_

- [x] 3. [实现] 实现 IPC 桥接模块
   - 实现文件: `src-tauri/src/ipc.rs`
   - 功能:
     - `handle_stdin()`: 监听 Node.js stdout 并解析
     - `forward_to_frontend()`: 通过 Tauri emit 推送到前端
     - `handle_frontend_invoke()`: 处理前端 invoke 调用并转发到 Node.js stdin
   - _Requirements: IPC 通信层实现_
   - _Scenarios: Node.js 到 Rust 的消息发送, Rust 到 SolidJS 的事件推送_
   - _TaskGroup: 5_

- [x] 4. [验证] Green 阶段
   - 运行: `cargo test --manifest-path=src-tauri/Cargo.toml ipc`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 5_

- [x] 5. [重构] 优化 IPC 桥接（可选）
   - 添加消息队列
   - 优化错误处理
   - _Requirements: IPC 通信层实现_
   - _TaskGroup: 5_

---

### SolidJS ipcService 实现 (任务组 6)

#### 包含场景
- Scenario: 初始化 IPC 监听
- Scenario: 发送事件到后端
- Scenario: 发送请求并等待响应
- Scenario: 监听来自后端的事件

#### 任务列表

- [x] 1. [测试] 编写 ipcService 测试
   - 测试文件: `src-ui/services/ipcService.test.ts`
   - 模拟 Tauri API 调用
   - 覆盖 initialize、emit、request、on 方法
   - _Requirements: SolidJS ipcService 实现_
   - _Scenarios: 初始化 IPC 监听, 发送事件到后端, 发送请求并等待响应, 监听来自后端的事件_
   - _TaskGroup: 6_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- ipcService.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 6_

- [x] 3. [实现] 实现 ipcService 模块
   - 实现文件: `src-ui/services/ipcService.ts`
   - 核心方法:
     - `initialize()`: 启动 Tauri 监听
     - `emit(event, payload)`: 调用 Tauri invoke
     - `request<T>(event, payload)`: 请求/响应模式
     - `on(event, handler)`: 注册事件处理器
     - `off(event, handler)`: 取消监听
   - 管理请求 ID 和 Promise
   - _Requirements: SolidJS ipcService 实现_
   - _Scenarios: 初始化 IPC 监听, 发送事件到后端, 发送请求并等待响应, 监听来自后端的事件_
   - _TaskGroup: 6_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- ipcService.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 6_

- [x] 5. [重构] 优化 ipcService（可选）
   - 添加类型安全
   - 优化事件订阅管理
   - _Requirements: SolidJS ipcService 实现_
   - _TaskGroup: 6_

---

### DesktopUIFactory 实现 (任务组 7)

#### 包含场景
- Scenario: 创建 DesktopUIFactory 实例
- Scenario: 创建 InteractiveUI 实例
- Scenario: 创建其他 UI 组件

#### 任务列表

- [x] 1. [测试] 编写 DesktopUIFactory 测试
   - 测试文件: `tests/ui/factories/DesktopUIFactory.test.ts`
   - 测试所有 create 方法
   - _Requirements: DesktopUIFactory 实现_
   - _Scenarios: 创建 DesktopUIFactory 实例, 创建 InteractiveUI 实例, 创建其他 UI 组件_
   - _TaskGroup: 7_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- DesktopUIFactory.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 7_

- [x] 3. [实现] 实现 DesktopUIFactory 类
   - 实现文件: `src/ui/factories/DesktopUIFactory.ts`
   - 实现 UIFactory 接口
   - 核心方法:
     - `createParser()`: 返回 DesktopParser 实例
     - `createOutput()`: 返回 DesktopOutput 实例
     - `createPermissionUI()`: 返回 DesktopPermissionUI 实例
     - `createInteractiveUI(callbacks, config)`: 返回 DesktopInteractiveUI 实例
   - _Requirements: DesktopUIFactory 实现_
   - _Scenarios: 创建 DesktopUIFactory 实例, 创建 InteractiveUI 实例, 创建其他 UI 组件_
   - _TaskGroup: 7_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- DesktopUIFactory.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 7_

- [x] 5. [重构] 优化工厂模式（可选）
   - 添加依赖注入容器
   - 优化实例缓存
   - _Requirements: DesktopUIFactory 实现_
   - _TaskGroup: 7_

---

### DesktopInteractiveUI 核心功能 (任务组 8)

#### 包含场景
- Scenario: 启动和停止 IPC 监听
- Scenario: 显示消息到前端
- Scenario: 显示工具调用
- Scenario: 请求用户确认

#### 任务列表

- [x] 1. [测试] 编写 DesktopInteractiveUI 测试
   - 测试文件: `tests/ui/implementations/desktop/DesktopInteractiveUI.test.ts`
   - 覆盖 start、stop、displayMessage、displayToolUse、promptConfirmation
   - _Requirements: DesktopInteractiveUI 实现_
   - _Scenarios: 启动和停止 IPC 监听, 显示消息到前端, 显示工具调用, 请求用户确认_
   - _TaskGroup: 8_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- DesktopInteractiveUI.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 8_

- [x] 3. [实现] 实现 DesktopInteractiveUI 类
   - 实现文件: `src/ui/implementations/desktop/DesktopInteractiveUI.ts`
   - 实现 InteractiveUIInterface 接口 (26 个方法)
   - 核心方法:
     - `start()`: 注册 IPC 监听
     - `stop()`: 取消监听并清理
     - `displayMessage(text, options)`: 发送 display_message 事件
     - `displayToolUse(toolUse)`: 发送 display_tool_use 事件
     - `promptConfirmation(message, options)`: 请求用户确认
   - 通过 IPCMessageAdapter 通信
   - _Requirements: DesktopInteractiveUI 实现_
   - _Scenarios: 启动和停止 IPC 监听, 显示消息到前端, 显示工具调用, 请求用户确认_
   - _TaskGroup: 8_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- DesktopInteractiveUI.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 8_

- [x] 5. [重构] 优化 DesktopInteractiveUI（可选）
   - 添加消息队列
   - 优化错误处理
   - _Requirements: DesktopInteractiveUI 实现_
   - _TaskGroup: 8_

---

### 黑曜石黑主题实现 (任务组 9)

#### 包含场景
- Scenario: 定义黑曜石黑主题 CSS 变量

#### 任务列表

- [x] 1. [测试] 编写主题变量测试
   - 测试文件: `src-ui/styles/__tests__/theme.test.ts`
   - 验证所有 CSS 变量定义
   - _Requirements: 基础 UI 布局实现_
   - _Scenarios: 定义黑曜石黑主题 CSS 变量_
   - _TaskGroup: 9_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- theme.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 9_

- [x] 3. [实现] 实现主题 CSS 文件
   - 实现文件: `src-ui/styles/theme.css`
   - 定义颜色变量: bg-primary, bg-secondary, bg-tertiary, bg-elevated
   - 定义边框变量: border-subtle, border-default, border-strong
   - 定义文本变量: text-primary, text-secondary, text-tertiary, text-disabled
   - 定义强调色: accent-primary, accent-secondary, accent-success, accent-warning, accent-error, accent-info
   - 定义圆角、间距、阴影变量
   - _Requirements: 基础 UI 布局实现_
   - _Scenarios: 定义黑曜石黑主题 CSS 变量_
   - _TaskGroup: 9_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- theme.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 9_

- [x] 5. [重构] 优化主题系统（可选）
   - 添加主题切换功能
   - 支持用户自定义颜色
   - _Requirements: 基础 UI 布局实现_
   - _TaskGroup: 9_

---

### 响应式布局框架 (任务组 10)

#### 包含场景
- Scenario: 响应式布局框架

#### 任务列表

- [x] 1. [测试] 编写布局测试
   - 测试文件: `src-ui/components/__tests__/Layout.test.tsx`
   - 测试最小窗口尺寸、侧边栏宽度、主内容区自适应
   - _Requirements: 基础 UI 布局实现_
   - _Scenarios: 响应式布局框架_
   - _TaskGroup: 10_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- Layout.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 10_

- [x] 3. [实现] 实现主布局组件
   - 实现文件: `src-ui/App.tsx`
   - 侧边栏: 固定宽度 240px, 可折叠
   - 主内容区: flex-grow 自适应
   - 最小窗口尺寸: 1200x800
   - _Requirements: 基础 UI 布局实现_
   - _Scenarios: 响应式布局框架_
   - _TaskGroup: 10_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- Layout.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 10_

- [x] 5. [重构] 优化布局（可选）
   - 添加窗口大小监听
   - 优化折叠动画
   - _Requirements: 基础 UI 布局实现_
   - _TaskGroup: 10_

---

### 通用组件库 (任务组 11)

#### 包含场景
- Scenario: 通用组件库

#### 任务列表

- [x] 1. [测试] 编写通用组件测试
   - 测试文件: `src-ui/components/common/__tests__/components.test.tsx`
   - 测试 Button、Input、Modal 组件
   - _Requirements: 基础 UI 布局实现_
   - _Scenarios: 通用组件库_
   - _TaskGroup: 11_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- components.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 11_

- [x] 3. [实现] 实现通用组件
   - 实现文件:
     - `src-ui/components/common/Button.tsx`: 5 种变体, 状态支持
     - `src-ui/components/common/Input.tsx`: 聚焦边框, 占位符样式
     - `src-ui/components/common/Modal.tsx`: 背景遮罩, 淡入动画
   - 应用黑曜石黑主题变量
   - _Requirements: 基础 UI 布局实现_
   - _Scenarios: 通用组件库_
   - _TaskGroup: 11_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- components.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 11_

- [x] 5. [重构] 优化组件库（可选）
   - 添加更多组件变体
   - 优化无障碍访问
   - _Requirements: 基础 UI 布局实现_
   - _TaskGroup: 11_

---

### 端到端验证 (任务组 12)

#### 包含场景
- Scenario: 前端启动后端进程
- Scenario: 双向 IPC 通信测试
- Scenario: 后端主动推送事件
- Scenario: 基础 UI 渲染验证

#### 任务列表

- [x] 1. [测试] 编写端到端测试
   - 测试文件: `tests/e2e/phase1-validation.test.ts`
   - 使用 Playwright 测试完整流程
   - _Requirements: 验证基础架构_
   - _Scenarios: 前端启动后端进程, 双向 IPC 通信测试, 后端主动推送事件, 基础 UI 渲染验证_
   - _TaskGroup: 12_

- [x] 2. [验证] Red 阶段
   - 运行: `npm run test:e2e`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 12_

- [x] 3. [实现] 集成所有模块
   - 确保所有模块正确集成
   - 配置 Tauri 主进程启动流程
   - 连接 Rust IPC 桥接与 Node.js 进程
   - _Requirements: 验证基础架构_
   - _Scenarios: 前端启动后端进程, 双向 IPC 通信测试, 后端主动推送事件, 基础 UI 渲染验证_
   - _TaskGroup: 12_

- [x] 4. [验证] Green 阶段
   - 运行: `npm run test:e2e`
   - 预期通过
   - 验证:
     - 应用能正常启动
     - IPC 双向通信延迟 < 100ms
     - 黑曜石黑主题正确应用
     - 布局无错位
   - _Validates: 3_
   - _TaskGroup: 12_

- [x] 5. [重构] 优化性能（可选）
   - 优化 IPC 消息传递
   - 减少启动时间
   - _Requirements: 验证基础架构_
   - _TaskGroup: 12_

---

## 总结

**总任务数**: 60 (12 个任务组 × 5 个任务)

**验收标准**:
- ✅ 应用能正常启动,无错误日志
- ✅ IPC 双向通信延迟 < 100ms
- ✅ UI 主题符合设计规范
- ✅ 所有单元测试和端到端测试通过
