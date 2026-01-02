/**
 * 文件功能：CI/CD 支持模块统一导出，导出 CI 环境检测相关的所有类和接口
 */

export {
  CISupport,
  CIDetector,
  StructuredLogger,
  TimeoutManager,
  TimeoutError,
  ExitCodes,
  type CIEnvironment,
  type LogLevel,
  type StructuredLogEntry,
  type TimeoutConfig,
  type CIConfig,
  type ExitCode,
} from './CISupport';
