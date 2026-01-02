# 变更记录 (Changelog)

本文档记录 Claude Replica 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/) 规范。

## [未发布]

## [v0.1.0] - 2026-01-02

### 新增
- 项目整体架构设计
- Claude Agent SDK 集成
- 完整的 CLI 命令行界面
- 会话管理系统
- 工具权限管理系统
- 多层级配置管理系统
- 扩展系统（技能、命令、代理、钩子）
- MCP（Model Context Protocol）集成
- 终端交互测试框架
- 属性测试（fast-check）

### 文档
- 添加项目文档规范
- 添加文件头文档规范
- 完整的 README 文档
- API 参考文档

---

## 最新提交详情

### c593ad1 - 2026-01-02 - 为所有源代码文件添加文件头文档规范

本次变更涉及 **64 个文件**，添加了统一的文件头注释规范，提高了代码可读性和维护性。

#### 变更类型
- **文档 (docs)**: 为所有 TypeScript 源文件添加标准化文档头

#### 变更范围
为以下模块的所有文件添加了文件头文档：

1. **核心入口文件**
   - `src/main.ts` - 主程序入口
   - `src/cli.ts` - CLI 入口点
   - `src/index.ts` - 项目主入口文件

2. **SDK 集成层**
   - `src/sdk/SDKQueryExecutor.ts` - SDK 查询执行器
   - `src/core/MessageRouter.ts` - 消息路由器
   - `src/core/SessionManager.ts` - 会话管理器
   - `src/core/StreamingMessageProcessor.ts` - 流式消息处理器

3. **配置管理系统**
   - `src/config/ConfigManager.ts` - 配置管理器
   - `src/config/SDKConfigLoader.ts` - SDK 配置加载器
   - `src/config/EnvConfig.ts` - 环境配置

4. **权限管理**
   - `src/permissions/PermissionManager.ts` - 权限管理器

5. **工具系统**
   - `src/tools/ToolRegistry.ts` - 工具注册表
   - `src/tools/*` - 各类工具处理器

6. **扩展系统**
   - `src/skills/SkillManager.ts` - 技能管理器
   - `src/commands/CommandManager.ts` - 命令管理器
   - `src/agents/AgentRegistry.ts` - 代理注册表
   - `src/hooks/HookManager.ts` - 钩子管理器
   - `src/mcp/MCPManager.ts` - MCP 管理器
   - `src/extensibility/ExtensibilityManager.ts` - 扩展性管理器

7. **其他核心模块**
   - `src/context/ContextManager.ts` - 上下文管理器
   - `src/security/SecurityManager.ts` - 安全管理器
   - `src/output/OutputFormatter.ts` - 输出格式化器
   - `src/testing/*` - 测试相关模块
   - `src/ui/InteractiveUI.ts` - 交互式 UI
   - `src/sandbox/SandboxManager.ts` - 沙箱管理器
   - `src/rewind/RewindManager.ts` - 回滚管理器
   - `src/plugins/PluginManager.ts` - 插件管理器
   - `src/performance/PerformanceManager.ts` - 性能管理器
   - `src/ci/CISupport.ts` - CI 支持
   - `src/collaboration/CollaborationManager.ts` - 协作管理器
   - `src/docs/DocumentGenerator.ts` - 文档生成器
   - `src/image/ImageHandler.ts` - 图片处理器
   - `src/language/LanguageSupport.ts` - 语言支持

#### 文档规范
每个文件头包含：
- **文件功能说明**：简洁描述文件的主要职责和功能
- **核心导出列表**：列出文件中的核心类、方法、常量等
- **作用说明**：为每个核心导出提供简短的作用说明

#### 示例格式
```typescript
/**
 * 文件功能：会话管理模块，负责创建、保存、加载和清理用户会话
 *
 * 核心类：
 * - SessionManager: 会话生命周期管理器
 *
 * 核心方法：
 * - createSession(): 创建新会话实例
 * - loadSession(): 从磁盘加载指定会话数据
 * - saveSession(): 持久化会话到本地存储
 * - cleanExpiredSessions(): 清理过期会话
 * - resumeSession(): 恢复现有会话并支持 SDK 会话续接
 */
```

#### 统计信息
- **总文件数**: 64 个
- **新增行数**: 401 行
- **删除行数**: 340 行
- **净增长**: 61 行（主要是文档内容）

#### 影响范围
- ✅ 提高了代码可读性
- ✅ 符合项目文档规范（`.claude/rules/file-header-documentation.md`）
- ✅ 便于新开发者理解代码结构
- ✅ 提高了代码维护性
- ✅ 无功能变更，仅文档改进

---

## 早期提交

### 43d2a64 - 2026-01-02 - 添加项目文档、代码规范和技能系统
- 添加项目文档和代码规范
- 实现技能系统
- 更新测试任务完成状态

### 8b76d95 - 2026-01-02 - 更新终端交互测试任务完成状态
- 终端交互测试功能

### a936273 - 2026-01-02 - 集成 Claude Agent SDK 并添加终端交互测试
- Claude Agent SDK 集成
- 终端交互测试框架

### 47ae444 - 2026-01-02 - 移除Claude代码副本的Agent SDK参考文档
- 移除无关的参考文档

