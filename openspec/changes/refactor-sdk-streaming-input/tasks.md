## 1. 核心流式输入实现

- [x] 1.1 在 `SDKQueryExecutor` 中添加 `executeStreaming()` 方法，接受 `AsyncGenerator` 输入
- [x] 1.2 创建 `StreamingQueryManager` 类，封装流式会话管理逻辑
- [x] 1.3 定义 `StreamMessage` 接口，支持文本和图像内容块

## 2. 消息构建增强

- [x] 2.1 在 `MessageRouter` 中添加 `buildStreamMessage()` 方法
- [x] 2.2 集成 `ImageHandler` 到消息构建流程，处理 `@./image.png` 语法
- [x] 2.3 添加 `ContentBlock` 类型定义，对齐 SDK 的消息格式

## 3. 应用层集成

- [x] 3.1 修改 `Application.handleUserMessage()` 使用 `StreamingQueryManager`
- [x] 3.2 更新 `InteractiveUI` 支持图像引用的输入提示和错误显示
- [x] 3.3 在 `Application.executeQuery()` 中保留兼容接口（内部使用流式实现）

## 4. 测试和文档

- [x] 4.1 为 `StreamingQueryManager` 编写单元测试
- [x] 4.2 为 `SDKQueryExecutor.executeStreaming()` 编写单元测试
- [x] 4.3 更新 `MessageRouter` 测试覆盖图像消息构建
- [x] 4.4 编写集成测试验证端到端流式输入流程

