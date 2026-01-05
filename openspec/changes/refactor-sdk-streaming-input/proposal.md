# 变更：重构 SDK 调用方式为流式输入模式

## 为什么

当前项目使用单消息输入模式调用 Claude Agent SDK，无法支持图像上传、动态消息队列、钩子集成等高级功能。根据官方文档推荐，流式输入模式（Streaming Input）是与 SDK 交互的首选方式，能提供完整的 AI Agent 能力。

## 变更内容

- **BREAKING** 修改 `SDKQueryExecutor` 接受 `AsyncGenerator` 作为输入，替代当前的字符串 `prompt`
- 添加 `StreamingQueryManager` 类，负责管理流式输入会话的生命周期
- 修改 `MessageRouter` 支持构建流式消息（包含文本和图像内容块）
- 在 `Application` 和 `InteractiveUI` 中集成流式输入处理逻辑
- 增强 `ImageHandler` 以支持在流式消息中附加图像
- 保留单消息输入作为向后兼容选项（用于简单的一次性查询场景）

## 影响

- 受影响的规范：`sdk-query`（新增能力）
- 受影响的代码：
  - `src/sdk/SDKQueryExecutor.ts` - 核心重构
  - `src/core/MessageRouter.ts` - 支持流式消息构建
  - `src/core/StreamingMessageProcessor.ts` - 处理流式响应
  - `src/main.ts` - 集成流式查询
  - `src/ui/InteractiveUI.ts` - 支持图像输入和消息队列
  - `src/image/ImageHandler.ts` - 集成到消息构建流程

