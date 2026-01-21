# 实施计划：Phase 2 核心功能

## 概述
实现聊天界面、工作区管理、权限管理 UI、文件修改预览和 Checkpoint 恢复功能,100% 复用现有核心模块。

## Reference
- Design: [design.md](../design.md)
- Specification: [spec.md](./spec.md)

## 任务

### chatStore 状态管理 (任务组 1)

#### 包含场景
- Scenario: 消息状态管理
- Scenario: 工具调用状态管理
- Scenario: 计算状态管理
- Scenario: 发送消息

#### 任务列表

- [x] 1. [测试] 编写 chatStore 测试
   - 测试文件: `src-ui/stores/__tests__/chatStore.test.ts`
   - 测试 messages, toolUses, isComputing, sendMessage
   - _Requirements: 聊天状态管理_
   - _Scenarios: 消息状态管理, 工具调用状态管理, 计算状态管理, 发送消息_
   - _TaskGroup: 1_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- chatStore.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 1_

- [x] 3. [实现] 实现 chatStore 模块
   - 实现文件: `src-ui/stores/chatStore.ts`
   - 状态定义:
     - messages: Signal<Message[]>
     - toolUses: Signal<ToolUse[]>
     - isComputing: Signal<boolean>
     - currentThinking: Signal<string | null>
   - 方法:
     - sendMessage(message): 发送到后端并乐观更新
     - interrupt(): 中断当前执行
   - 订阅 IPC 事件: display_message, display_tool_use, display_computing, stop_computing
   - _Requirements: 聊天状态管理_
   - _Scenarios: 消息状态管理, 工具调用状态管理, 计算状态管理, 发送消息_
   - _TaskGroup: 1_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- chatStore.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 1_

- [x] 5. [重构] 优化状态管理（可选）
   - 添加消息分页
   - 优化内存管理
   - _Requirements: 聊天状态管理_
   - _TaskGroup: 1_

---

### 聊天 UI 组件 (任务组 2)

#### 包含场景
- Scenario: 用户发送消息并接收流式响应
- Scenario: 工具调用可视化展示
- Scenario: 思考内容实时显示
- Scenario: Markdown 消息渲染

#### 任务列表

- [x] 1. [测试] 编写聊天 UI 组件测试
   - 测试文件: `src-ui/views/__tests__/ChatView.test.tsx`
   - 测试消息列表、输入框、工具调用展示、思考指示器
   - _Requirements: 聊天界面实现_
   - _Scenarios: 用户发送消息并接收流式响应, 工具调用可视化展示, 思考内容实时显示, Markdown 消息渲染_
   - _TaskGroup: 2_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- ChatView.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 2_

- [x] 3. [实现] 实现聊天 UI 组件
   - 实现文件:
     - `src-ui/views/ChatView.tsx`: 聊天视图容器
     - `src-ui/components/chat/MessageList.tsx`: 消息列表 (虚拟滚动)
     - `src-ui/components/chat/InputBox.tsx`: 输入框 (支持 Cmd+Enter)
     - `src-ui/components/chat/ToolUseDisplay.tsx`: 工具调用卡片
     - `src-ui/components/chat/ThinkingIndicator.tsx`: 思考指示器
   - 集成 markdown-it 库渲染 Markdown
   - 集成代码高亮库 (highlight.js)
   - _Requirements: 聊天界面实现_
   - _Scenarios: 用户发送消息并接收流式响应, 工具调用可视化展示, 思考内容实时显示, Markdown 消息渲染_
   - _TaskGroup: 2_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- ChatView.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 2_

- [x] 5. [重构] 优化聊天 UI（可选）
   - 优化虚拟滚动性能
   - 添加消息搜索功能
   - _Requirements: 聊天界面实现_
   - _TaskGroup: 2_

---

### workspaceStore 状态管理 (任务组 3)

#### 包含场景
- Scenario: 工作区列表管理
- Scenario: 切换当前工作区
- Scenario: 会话历史管理

#### 任务列表

- [x] 1. [测试] 编写 workspaceStore 测试
   - 测试文件: `src-ui/stores/__tests__/workspaceStore.test.ts`
   - 测试 workspaces, currentWorkspace, sessionHistory, switchWorkspace
   - _Requirements: 工作区状态管理_
   - _Scenarios: 工作区列表管理, 切换当前工作区, 会话历史管理_
   - _TaskGroup: 3_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- workspaceStore.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 3_

- [x] 3. [实现] 实现 workspaceStore 模块
   - 实现文件: `src-ui/stores/workspaceStore.ts`
   - 状态定义:
     - workspaces: Signal<Workspace[]>
     - currentWorkspace: Signal<Workspace | null>
     - sessionHistory: Signal<Session[]>
   - 方法:
     - createWorkspace(path): 创建工作区
     - switchWorkspace(id): 切换工作区
     - loadSessionHistory(): 加载会话历史
   - 本地存储持久化
   - _Requirements: 工作区状态管理_
   - _Scenarios: 工作区列表管理, 切换当前工作区, 会话历史管理_
   - _TaskGroup: 3_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- workspaceStore.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 3_

- [x] 5. [重构] 优化工作区管理（可选）
   - 添加工作区搜索
   - 优化切换性能
   - _Requirements: 工作区状态管理_
   - _TaskGroup: 3_

---

### 工作区管理 UI (任务组 4)

#### 包含场景
- Scenario: 创建新工作区
- Scenario: 切换工作区
- Scenario: 浏览会话历史
- Scenario: 恢复历史会话

#### 任务列表

- [x] 1. [测试] 编写工作区 UI 测试
   - 测试文件: `src-ui/views/__tests__/WorkspaceView.test.tsx`
   - 测试工作区列表、创建、切换、会话历史
   - _Requirements: 工作区管理功能_
   - _Scenarios: 创建新工作区, 切换工作区, 浏览会话历史, 恢复历史会话_
   - _TaskGroup: 4_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- WorkspaceView.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 4_

- [x] 3. [实现] 实现工作区 UI 组件
   - 实现文件:
     - `src-ui/views/WorkspaceView.tsx`: 工作区管理视图
     - `src-ui/components/workspace/WorkspaceList.tsx`: 工作区列表
     - `src-ui/components/workspace/SessionHistory.tsx`: 会话历史列表
   - 集成 Tauri 文件选择器 API
   - 切换过程添加加载指示器
   - _Requirements: 工作区管理功能_
   - _Scenarios: 创建新工作区, 切换工作区, 浏览会话历史, 恢复历史会话_
   - _TaskGroup: 4_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- WorkspaceView.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 4_

- [x] 5. [重构] 优化工作区 UI（可选）
   - 添加工作区图标
   - 优化切换动画
   - _Requirements: 工作区管理功能_
   - _TaskGroup: 4_

---

### DesktopPermissionUI 实现 (任务组 5)

#### 包含场景
- Scenario: 工具调用时请求权限
- Scenario: 用户允许权限
- Scenario: 用户拒绝权限

#### 任务列表

- [x] 1. [测试] 编写 DesktopPermissionUI 测试
   - 测试文件: `tests/ui/implementations/desktop/DesktopPermissionUI.test.ts`
   - 测试 promptForPermission, 用户响应处理
   - _Requirements: 权限管理 UI_
   - _Scenarios: 工具调用时请求权限, 用户允许权限, 用户拒绝权限_
   - _TaskGroup: 5_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- DesktopPermissionUI.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 5_

- [x] 3. [实现] 实现 DesktopPermissionUI 类
   - 实现文件: `src/ui/implementations/desktop/DesktopPermissionUI.ts`
   - 实现 PermissionUI 接口
   - 核心方法:
     - `promptForPermission(toolName, details)`: 通过 IPC 请求权限
     - 返回 Promise 等待用户响应
   - 集成 PermissionManager
   - _Requirements: 权限管理 UI_
   - _Scenarios: 工具调用时请求权限, 用户允许权限, 用户拒绝权限_
   - _TaskGroup: 5_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- DesktopPermissionUI.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 5_

- [x] 5. [重构] 优化权限 UI（可选）
   - 添加权限缓存
   - 优化请求性能
   - _Requirements: 权限管理 UI_
   - _TaskGroup: 5_

---

### 权限确认对话框 UI (任务组 6)

#### 包含场景
- Scenario: 工具调用时请求权限
- Scenario: 用户允许权限
- Scenario: 用户拒绝权限

#### 任务列表

- [x] 1. [测试] 编写权限对话框测试
   - 测试文件: `src-ui/components/common/__tests__/PermissionModal.test.tsx`
   - 测试对话框显示、用户交互、响应发送
   - _Requirements: 权限管理 UI_
   - _Scenarios: 工具调用时请求权限, 用户允许权限, 用户拒绝权限_
   - _TaskGroup: 6_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- PermissionModal.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 6_

- [x] 3. [实现] 实现权限对话框组件
   - 实现文件: `src-ui/components/common/PermissionModal.tsx`
   - 显示工具名称、操作描述、目标资源
   - 提供三个按钮: "允许一次"、"总是允许"、"拒绝"
   - 通过 IPC 发送用户响应
   - 订阅 IPC 权限请求事件
   - _Requirements: 权限管理 UI_
   - _Scenarios: 工具调用时请求权限, 用户允许权限, 用户拒绝权限_
   - _TaskGroup: 6_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- PermissionModal.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 6_

- [x] 5. [重构] 优化对话框（可选）
   - 添加动画效果
   - 优化无障碍访问
   - _Requirements: 权限管理 UI_
   - _TaskGroup: 6_

---

### 权限设置界面 (任务组 7)

#### 包含场景
- Scenario: 切换权限模式
- Scenario: 查看权限历史

#### 任务列表

- [x] 1. [测试] 编写权限设置测试
   - 测试文件: `src-ui/components/settings/__tests__/PermissionSettings.test.tsx`
   - 测试权限模式切换、历史查看
   - _Requirements: 权限管理 UI_
   - _Scenarios: 切换权限模式, 查看权限历史_
   - _TaskGroup: 7_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- PermissionSettings.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 7_

- [x] 3. [实现] 实现权限设置组件
   - 实现文件: `src-ui/components/settings/PermissionSettings.tsx`
   - 权限模式选择器 (4 种模式)
   - 当前模式指示器
   - 权限历史列表 (可过滤)
   - 工具白名单/黑名单配置
   - _Requirements: 权限管理 UI_
   - _Scenarios: 切换权限模式, 查看权限历史_
   - _TaskGroup: 7_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- PermissionSettings.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 7_

- [x] 5. [重构] 优化设置界面（可选）
   - 添加搜索功能
   - 优化列表性能
   - _Requirements: 权限管理 UI_
   - _TaskGroup: 7_

---

### 文件 Diff 组件 (任务组 8)

#### 包含场景
- Scenario: 显示文件修改 Diff
- Scenario: 语法高亮
- Scenario: 折叠/展开代码块
- Scenario: 审核和确认修改

#### 任务列表

- [x] 1. [测试] 编写文件 Diff 测试
   - 测试文件: `src-ui/components/files/__tests__/FileDiff.test.tsx`
   - 测试 Diff 渲染、语法高亮、折叠、确认
   - _Requirements: 文件修改预览_
   - _Scenarios: 显示文件修改 Diff, 语法高亮, 折叠/展开代码块, 审核和确认修改_
   - _TaskGroup: 8_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- FileDiff.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 8_

- [x] 3. [实现] 实现文件 Diff 组件
   - 实现文件: `src-ui/components/files/FileDiff.tsx`
   - 集成 CodeMirror 6 编辑器
   - 使用 diff 库生成差异
   - 支持并排对比和统一视图
   - 根据文件类型应用语法高亮
   - 支持折叠/展开未修改代码块
   - 提供 "确认修改" 和 "取消" 按钮
   - _Requirements: 文件修改预览_
   - _Scenarios: 显示文件修改 Diff, 语法高亮, 折叠/展开代码块, 审核和确认修改_
   - _TaskGroup: 8_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- FileDiff.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 8_

- [x] 5. [重构] 优化 Diff 组件（可选）
   - 优化大文件性能
   - 添加行号显示
   - _Requirements: 文件修改预览_
   - _TaskGroup: 8_

---

### Checkpoint 恢复 UI (任务组 9)

#### 包含场景
- Scenario: 显示快照列表
- Scenario: 时间轴可视化
- Scenario: 预览快照差异
- Scenario: 恢复到历史快照

#### 任务列表

- [x] 1. [测试] 编写 Checkpoint UI 测试
   - 测试文件: `src-ui/components/files/__tests__/RewindMenu.test.tsx`
   - 测试快照列表、时间轴、差异预览、恢复
   - _Requirements: Checkpoint 恢复 UI_
   - _Scenarios: 显示快照列表, 时间轴可视化, 预览快照差异, 恢复到历史快照_
   - _TaskGroup: 9_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- RewindMenu.test.tsx`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 9_

- [x] 3. [实现] 实现 Checkpoint UI 组件
   - 实现文件: `src-ui/components/files/RewindMenu.tsx`
   - 快照列表视图 (按时间倒序)
   - 时间轴视图 (可缩放和拖动)
   - 差异预览 (复用 FileDiff 组件)
   - 恢复确认对话框
   - 通过 IPC 调用 CheckpointManager
   - _Requirements: Checkpoint 恢复 UI_
   - _Scenarios: 显示快照列表, 时间轴可视化, 预览快照差异, 恢复到历史快照_
   - _TaskGroup: 9_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- RewindMenu.test.tsx`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 9_

- [x] 5. [重构] 优化 Checkpoint UI（可选）
   - 添加快照搜索
   - 优化时间轴性能
   - _Requirements: Checkpoint 恢复 UI_
   - _TaskGroup: 9_

---

### 核心模块集成验证 (任务组 10)

#### 包含场景
- Scenario: 复用 StreamingQueryManager
- Scenario: 复用 MessageRouter
- Scenario: 复用 SessionManager
- Scenario: 复用 PermissionManager
- Scenario: 复用 CheckpointManager

#### 任务列表

- [x] 1. [测试] 编写核心模块集成测试
   - 测试文件: `tests/integration/core-modules.test.ts`
   - 验证所有核心模块正确集成
   - _Requirements: 复用现有核心模块_
   - _Scenarios: 复用 StreamingQueryManager, 复用 MessageRouter, 复用 SessionManager, 复用 PermissionManager, 复用 CheckpointManager_
   - _TaskGroup: 10_

- [x] 2. [验证] Red 阶段
   - 运行: `npm test -- core-modules.test.ts`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 10_

- [x] 3. [实现] 集成核心模块
   - 确保 DesktopInteractiveUI 正确调用 StreamingQueryManager
   - 确保 DesktopRunner 正确使用 MessageRouter
   - 确保工作区管理使用 SessionManager
   - 确保权限管理使用 PermissionManager
   - 确保文件修改使用 CheckpointManager
   - 不修改任何核心模块代码
   - _Requirements: 复用现有核心模块_
   - _Scenarios: 复用 StreamingQueryManager, 复用 MessageRouter, 复用 SessionManager, 复用 PermissionManager, 复用 CheckpointManager_
   - _TaskGroup: 10_

- [x] 4. [验证] Green 阶段
   - 运行: `npm test -- core-modules.test.ts`
   - 预期通过
   - _Validates: 3_
   - _TaskGroup: 10_

- [x] 5. [重构] 优化集成（可选）
   - 添加错误处理
   - 优化性能
   - _Requirements: 复用现有核心模块_
   - _TaskGroup: 10_

---

### Phase 2 端到端验证 (任务组 11)

#### 包含场景
- 所有 Phase 2 场景的集成验证

#### 任务列表

- [x] 1. [测试] 编写 Phase 2 端到端测试
   - 测试文件: `tests/e2e/phase2-validation.test.ts`
   - 使用 Playwright 测试完整流程
   - 覆盖聊天、工作区、权限、Diff、Checkpoint
   - _Requirements: 所有 Phase 2 需求_
   - _TaskGroup: 11_

- [x] 2. [验证] Red 阶段
   - 运行: `npm run test:e2e -- phase2-validation`
   - 预期失败
   - _Validates: 1_
   - _TaskGroup: 11_

- [x] 3. [实现] 集成所有 Phase 2 功能
   - 确保所有功能正确集成
   - 修复集成问题
   - _Requirements: 所有 Phase 2 需求_
   - _TaskGroup: 11_

- [x] 4. [验证] Green 阶段
   - 运行: `npm run test:e2e -- phase2-validation`
   - 预期通过
   - 验证:
     - ✅ 能发送消息并收到流式响应
     - ✅ 工具调用正确展示
     - ✅ 工作区切换无误
     - ✅ 权限确认对话框正常弹出
     - ✅ 文件 Diff 正确显示
     - ✅ 快照恢复功能正常
   - _Validates: 3_
   - _TaskGroup: 11_

- [x] 5. [重构] 优化整体性能（可选）
   - 优化加载速度
   - 减少内存占用
   - _Requirements: 所有 Phase 2 需求_
   - _TaskGroup: 11_

---

## 总结

**总任务数**: 55 (11 个任务组 × 5 个任务)

**验收标准**:
- ✅ 能正常发送消息并收到流式响应
- ✅ 工具调用正确展示
- ✅ 工作区切换无误
- ✅ 权限确认对话框正常弹出
- ✅ 文件 Diff 正确显示
- ✅ 快照恢复功能正常
- ✅ 100% 复用现有核心模块
