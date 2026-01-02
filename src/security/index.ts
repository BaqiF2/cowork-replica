/**
 * 文件功能：安全模块统一导出，导出安全管理相关的所有类和接口
 */

export {
  SecurityManager,
  type SensitiveInfoType,
  type SensitiveInfoMatch,
  type DangerousCommandType,
  type DangerousCommandMatch,
  type SensitiveFileConfig,
  type SecurityConfig,
  type APIKeyConfig,
  type ConfirmationCallback,
  type WarningCallback,
} from './SecurityManager';
