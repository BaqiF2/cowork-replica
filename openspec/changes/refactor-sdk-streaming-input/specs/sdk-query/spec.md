## ADDED Requirements

### Requirement: Streaming Input Mode Support
系统必须（SHALL）支持流式输入模式与 Claude Agent SDK 交互，允许通过 AsyncGenerator 发送消息序列。

#### Scenario: 发送单条文本消息（流式模式）
- **GIVEN** 已初始化的流式会话
- **WHEN** 用户发送一条纯文本消息
- **THEN** 系统通过 AsyncGenerator yield 消息到 SDK
- **AND** 系统流式接收并显示 AI 响应

#### Scenario: 发送包含图像的消息
- **GIVEN** 已初始化的流式会话
- **WHEN** 用户发送包含 `@./image.png` 引用的消息
- **THEN** 系统解析图像引用并加载图像文件
- **AND** 系统构建包含文本和图像内容块的消息
- **AND** 系统通过 AsyncGenerator yield 多内容块消息到 SDK

#### Scenario: 图像引用文件不存在
- **GIVEN** 已初始化的流式会话
- **WHEN** 用户发送包含无效图像引用 `@./nonexistent.png` 的消息
- **THEN** 系统显示错误提示 "Image file does not exist"
- **AND** 系统不发送消息到 SDK

### Requirement: Message Queue Support
系统必须（SHALL）支持消息队列，允许在处理前一条消息时排队后续消息。

#### Scenario: 排队多条消息
- **GIVEN** 已初始化的流式会话
- **AND** 当前正在处理一条消息
- **WHEN** 用户发送新消息
- **THEN** 新消息被添加到队列
- **AND** 前一条消息完成后自动处理队列中的下一条消息

### Requirement: Session Interruption
系统必须（SHALL）支持中断正在进行的流式会话。

#### Scenario: 用户中断当前消息处理
- **GIVEN** 流式会话正在处理消息
- **WHEN** 用户按下 Esc 键
- **THEN** 系统调用 AbortController.abort()
- **AND** 系统停止当前消息处理
- **AND** 系统显示中断状态
- **AND** 消息队列中的后续消息继续处理

### Requirement: Backward Compatible Single Message API
系统必须（SHALL）保留单消息输入的兼容接口。

#### Scenario: 非交互模式使用单消息 API
- **GIVEN** 应用以非交互模式运行（-p 参数）
- **WHEN** 用户提供查询内容
- **THEN** 系统使用单消息 API 执行查询
- **AND** 返回完整响应后退出

#### Scenario: 单消息 API 内部实现
- **GIVEN** 调用 `SDKQueryExecutor.execute(options)` 方法
- **WHEN** options 包含字符串 prompt
- **THEN** 系统内部转换为单条消息的 AsyncGenerator
- **AND** 使用流式执行逻辑处理

