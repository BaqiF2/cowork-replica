/**
 * 文件功能：SDK 模块统一导出，导出 SDK 查询执行器相关的所有类和接口
 */

export {
  SDKQueryExecutor,
  SDKQueryOptions,
  SDKQueryResult,
  SDKErrorType,
  SDKError,
  ERROR_MESSAGES,
  classifySDKError,
  createSDKError,
  getErrorMessage,
  mapToSDKOptions,
} from './SDKQueryExecutor';

// 重新导出 SDK 类型以便其他模块使用
export type {
  PermissionMode,
  AgentDefinition,
  McpServerConfig,
  SandboxSettings,
  HookEvent,
  HookCallbackMatcher,
  CanUseTool,
} from '@anthropic-ai/claude-agent-sdk';
