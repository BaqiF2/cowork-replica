# Phase 2: 核心功能 - SelfSpec 规格说明

## ADDED Requirements

### Requirement: 聊天界面实现
系统必须实现实时流式消息显示、用户输入、工具调用可视化和思考内容展示功能。

#### Scenario: 用户发送消息并接收流式响应
- **GIVEN** 聊天界面已加载
- **WHEN** 用户输入 "Hello, Claude" 并点击发送
- **THEN** 消息应立即显示在消息列表
- **AND** 显示计算状态指示器
- **AND** 实时接收并渲染 Claude 的流式响应
- **AND** 响应完成后隐藏计算状态指示器

#### Scenario: 工具调用可视化展示
- **GIVEN** Claude 正在处理用户请求
- **WHEN** Claude 调用 Read 工具读取文件
- **THEN** 应显示工具调用卡片
- **AND** 卡片包含工具名称、参数、执行状态
- **AND** 工具执行完成后显示结果摘要
- **AND** 支持展开/折叠详细信息

#### Scenario: 思考内容实时显示
- **GIVEN** Claude 正在生成响应
- **WHEN** Claude 输出思考内容 (thinking)
- **THEN** 应在消息上方显示思考指示器
- **AND** 实时更新思考文本
- **AND** 思考结束后自动隐藏

#### Scenario: Markdown 消息渲染
- **GIVEN** Claude 返回包含 Markdown 格式的消息
- **WHEN** 消息包含代码块、列表、链接等
- **THEN** 应正确渲染 Markdown 格式
- **AND** 代码块支持语法高亮
- **AND** 链接可点击

---

### Requirement: 工作区管理功能
系统必须支持创建/切换工作区、管理工作区配置、浏览会话历史和快照回退。

#### Scenario: 创建新工作区
- **GIVEN** 用户在工作区管理界面
- **WHEN** 用户点击 "新建工作区" 并选择文件夹路径
- **THEN** 应创建新的工作区配置
- **AND** 初始化 SessionManager
- **AND** 在工作区列表中显示新工作区
- **AND** 自动切换到新工作区

#### Scenario: 切换工作区
- **GIVEN** 用户有多个工作区
- **WHEN** 用户切换到另一个工作区
- **THEN** 应保存当前工作区状态
- **AND** 加载目标工作区的会话历史
- **AND** 更新 UI 显示目标工作区的内容
- **AND** 切换过程 < 500ms

#### Scenario: 浏览会话历史
- **GIVEN** 工作区已有多个会话
- **WHEN** 用户打开会话历史列表
- **THEN** 应按时间倒序显示所有会话
- **AND** 每个会话显示摘要、时间、消息数量
- **AND** 支持搜索和过滤

#### Scenario: 恢复历史会话
- **GIVEN** 用户查看会话历史
- **WHEN** 用户选择一个历史会话
- **THEN** 应加载该会话的完整消息历史
- **AND** 恢复会话上下文
- **AND** 用户可以继续对话

---

### Requirement: 权限管理 UI
系统必须实现可视化权限请求弹窗、权限模式切换、权限历史记录和工具白名单/黑名单配置。

#### Scenario: 工具调用时请求权限
- **GIVEN** 权限模式为 "default"
- **WHEN** Claude 尝试调用 Edit 工具修改文件
- **THEN** 应弹出权限确认对话框
- **AND** 对话框显示工具名称、目标文件、操作描述
- **AND** 提供 "允许一次"、"总是允许"、"拒绝" 选项
- **AND** 阻塞工具执行直到用户响应

#### Scenario: 用户允许权限
- **GIVEN** 权限确认对话框已显示
- **WHEN** 用户点击 "允许一次"
- **THEN** 应关闭对话框
- **AND** 允许工具执行
- **AND** 记录权限决策到历史
- **AND** 不修改全局权限配置

#### Scenario: 用户拒绝权限
- **GIVEN** 权限确认对话框已显示
- **WHEN** 用户点击 "拒绝"
- **THEN** 应关闭对话框
- **AND** 拒绝工具执行
- **AND** Claude 收到权限拒绝错误
- **AND** 记录权限决策到历史

#### Scenario: 切换权限模式
- **GIVEN** 用户在设置界面
- **WHEN** 用户切换权限模式到 "acceptEdits"
- **THEN** 应更新 PermissionManager 配置
- **AND** 后续编辑操作不再请求权限
- **AND** 读操作仍需请求权限
- **AND** 显示当前权限模式指示器

#### Scenario: 查看权限历史
- **GIVEN** 用户已进行多次权限决策
- **WHEN** 用户打开权限历史
- **THEN** 应显示所有权限请求记录
- **AND** 每条记录包含工具名称、时间、决策结果
- **AND** 支持按工具类型过滤

---

### Requirement: 文件修改预览
系统必须实现可视化文件修改 Diff 展示、语法高亮、代码块折叠和修改确认功能。

#### Scenario: 显示文件修改 Diff
- **GIVEN** Claude 修改了一个文件
- **WHEN** 权限确认对话框显示修改详情
- **THEN** 应使用 Diff 视图显示修改内容
- **AND** 高亮显示新增、删除、修改的行
- **AND** 支持并排对比和统一视图模式

#### Scenario: 语法高亮
- **GIVEN** 文件修改 Diff 已显示
- **WHEN** 文件为代码文件 (如 .ts, .js)
- **THEN** 应根据文件类型应用语法高亮
- **AND** 高亮颜色与黑曜石黑主题协调

#### Scenario: 折叠/展开代码块
- **GIVEN** Diff 视图中有大段未修改代码
- **WHEN** 用户点击折叠按钮
- **THEN** 应折叠未修改的代码块
- **AND** 显示折叠提示 (如 "20 行未修改")
- **WHEN** 用户点击展开
- **THEN** 应显示完整代码

#### Scenario: 审核和确认修改
- **GIVEN** 文件修改 Diff 已显示
- **WHEN** 用户审核修改后点击 "确认修改"
- **THEN** 应应用文件修改
- **AND** 创建 Checkpoint 快照
- **AND** 关闭预览窗口
- **AND** 更新文件列表状态

---

### Requirement: Checkpoint 恢复 UI
系统必须实现快照列表展示、时间轴可视化、一键恢复和差异预览功能。

#### Scenario: 显示快照列表
- **GIVEN** 工作区已有多个文件修改快照
- **WHEN** 用户打开快照管理界面
- **THEN** 应按时间倒序显示所有快照
- **AND** 每个快照显示创建时间、影响文件数量、操作描述
- **AND** 支持搜索和过滤

#### Scenario: 时间轴可视化
- **GIVEN** 快照列表已显示
- **WHEN** 用户切换到时间轴视图
- **THEN** 应以时间轴形式展示快照
- **AND** 时间轴节点标注关键操作
- **AND** 支持缩放和拖动

#### Scenario: 预览快照差异
- **GIVEN** 用户选择一个历史快照
- **WHEN** 用户点击 "预览差异"
- **THEN** 应显示当前状态与快照的 Diff
- **AND** 列出所有受影响的文件
- **AND** 每个文件支持查看详细 Diff

#### Scenario: 恢复到历史快照
- **GIVEN** 用户预览了快照差异
- **WHEN** 用户点击 "恢复到此快照"
- **THEN** 应弹出确认对话框
- **AND** 用户确认后执行恢复操作
- **AND** 将所有文件恢复到快照状态
- **AND** 创建新的快照记录本次恢复
- **AND** 通知用户恢复完成

---

### Requirement: 聊天状态管理
系统必须使用 SolidJS Signals 管理聊天状态,支持消息列表、工具调用、计算状态和思考内容。

#### Scenario: 消息状态管理
- **GIVEN** chatStore 已初始化
- **WHEN** 接收到新消息
- **THEN** 应更新 messages Signal
- **AND** 自动触发 UI 重新渲染
- **AND** 消息按时间顺序排列

#### Scenario: 工具调用状态管理
- **GIVEN** chatStore 已初始化
- **WHEN** 接收到工具调用事件
- **THEN** 应更新 toolUses Signal
- **AND** 关联到对应的消息
- **AND** 自动触发工具调用组件更新

#### Scenario: 计算状态管理
- **GIVEN** chatStore 已初始化
- **WHEN** 接收到 display_computing 事件
- **THEN** 应将 isComputing Signal 设为 true
- **AND** 显示计算指示器
- **WHEN** 接收到 stop_computing 事件
- **THEN** 应将 isComputing Signal 设为 false
- **AND** 隐藏计算指示器

#### Scenario: 发送消息
- **GIVEN** 用户输入消息
- **WHEN** 调用 `chatStore.sendMessage(message)`
- **THEN** 应通过 ipcService 发送消息到后端
- **AND** 乐观更新 messages Signal 添加用户消息
- **AND** 设置 isComputing 为 true

---

### Requirement: 工作区状态管理
系统必须使用 SolidJS Signals 管理工作区列表、当前工作区和会话历史。

#### Scenario: 工作区列表管理
- **GIVEN** workspaceStore 已初始化
- **WHEN** 创建新工作区
- **THEN** 应更新 workspaces Signal
- **AND** 持久化到本地存储
- **AND** 自动触发工作区列表 UI 更新

#### Scenario: 切换当前工作区
- **GIVEN** workspaceStore 已初始化
- **WHEN** 调用 `workspaceStore.switchWorkspace(workspaceId)`
- **THEN** 应更新 currentWorkspace Signal
- **AND** 通过 IPC 通知后端加载工作区会话
- **AND** 自动更新 UI 显示

#### Scenario: 会话历史管理
- **GIVEN** 工作区已加载
- **WHEN** 通过 IPC 接收会话历史数据
- **THEN** 应更新 sessionHistory Signal
- **AND** 按时间排序
- **AND** 自动触发会话列表 UI 更新

---

### Requirement: 复用现有核心模块
系统必须 100% 复用 StreamingQueryManager、MessageRouter、SessionManager、PermissionManager 和 CheckpointManager。

#### Scenario: 复用 StreamingQueryManager
- **GIVEN** DesktopInteractiveUI 已创建
- **WHEN** 发送用户消息到 Claude
- **THEN** 应通过 StreamingQueryManager 处理流式响应
- **AND** StreamingQueryManager 回调通过 IPC 推送到前端
- **AND** 不修改 StreamingQueryManager 代码

#### Scenario: 复用 MessageRouter
- **GIVEN** 桌面运行器已启动
- **WHEN** 构建 Claude API 查询参数
- **THEN** 应使用 MessageRouter.buildStreamMessage
- **AND** 应用权限处理器
- **AND** 不修改 MessageRouter 代码

#### Scenario: 复用 SessionManager
- **GIVEN** 工作区已创建
- **WHEN** 保存会话数据
- **THEN** 应使用 SessionManager 持久化到文件
- **AND** 加载会话时从 SessionManager 读取
- **AND** 不修改 SessionManager 代码

#### Scenario: 复用 PermissionManager
- **GIVEN** DesktopPermissionUI 已创建
- **WHEN** 工具请求权限
- **THEN** 应使用 PermissionManager.createCanUseToolHandler
- **AND** 根据权限模式决策
- **AND** 不修改 PermissionManager 代码

#### Scenario: 复用 CheckpointManager
- **GIVEN** 文件修改操作触发
- **WHEN** 创建快照
- **THEN** 应使用 CheckpointManager.createCheckpoint
- **AND** 快照恢复使用 CheckpointManager.restoreCheckpoint
- **AND** 不修改 CheckpointManager 代码
