/**
 * 文件功能：扩展性架构模块统一导出，导出插件 API 和工具扩展相关的所有类和接口
 */

export {
  // 管理器
  ExtensibilityManager,
  ExtensibilityManagerConfig,

  // 工具定义
  CustomToolDefinition,
  ToolParameter,
  ParameterType,

  // 执行相关
  ToolExecutor,
  StreamingToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
  StreamChunk,

  // 钩子相关
  ToolHookEvent,
  ToolHookContext,
  ToolHookHandler,

  // 错误类型
  ParameterValidationError,
  ToolExecutionError,
  ToolTimeoutError,
} from './ExtensibilityManager';
