/**
 * 环境变量访问工具
 * 支持浏览器 (import.meta.env) 和 Node.js (process.env) 环境
 */

type EnvRecord = Record<string, string | undefined>;

// 获取 Vite 环境变量（如果可用）
const getViteEnv = (): EnvRecord | null => {
  try {
    // 使用动态访问绕过 TypeScript 编译检查
    // 在 Vite 环境中 import.meta.env 可用
    const meta = (globalThis as Record<string, unknown>)['import' + '.meta'] as
      | { env?: EnvRecord }
      | undefined;
    if (meta?.env) {
      return meta.env;
    }
  } catch {
    // 在非 Vite 环境中忽略错误
  }
  return null;
};

const getEnvSource = (): EnvRecord => {
  // Node.js 环境 (测试) - 优先检查
  if (typeof process !== 'undefined' && process.env) {
    return process.env as EnvRecord;
  }
  // Vite 浏览器环境
  const viteEnv = getViteEnv();
  if (viteEnv) {
    return viteEnv;
  }
  return {};
};

export const getEnv = (key: string, defaultValue: string = ''): string => {
  const env = getEnvSource();
  // Vite 使用 VITE_ 前缀，也检查原始 key
  return env[`VITE_${key}`] ?? env[key] ?? defaultValue;
};

export const getEnvInt = (key: string, defaultValue: number): number => {
  const value = getEnv(key, String(defaultValue));
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};
