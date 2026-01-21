import { normalizeWorkspaceSelection } from '../../views/workspaceViewUtils';
import { getEnv } from '../../utils/env';

interface DialogModule {
  open: (options: {
    directory?: boolean;
    multiple?: boolean;
    title?: string;
  }) => Promise<string | string[] | null>;
}

const PICKER_TITLE = getEnv('COWORK_WORKSPACE_PICKER_TITLE', 'Select workspace folder');

// 检测是否在 Tauri 环境中运行
const isTauriEnv = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// 动态导入 Tauri dialog，绕过 Vite 静态分析
const importTauriDialog = async (): Promise<DialogModule | null> => {
  if (!isTauriEnv()) {
    return null;
  }
  try {
    // 使用间接方式导入以绕过 Vite 静态分析
    const modulePath = '@tauri-apps/plugin-dialog';
    const module = await (Function('modulePath', 'return import(modulePath)')(modulePath));
    return module as DialogModule;
  } catch {
    return null;
  }
};

export const selectWorkspaceDirectory = async (): Promise<string | null> => {
  const dialog = await importTauriDialog();

  if (dialog) {
    try {
      const selection = await dialog.open({
        directory: true,
        multiple: false,
        title: PICKER_TITLE,
      });
      return normalizeWorkspaceSelection(selection);
    } catch {
      // 如果 Tauri dialog 失败，回退到 prompt
    }
  }

  // 回退到浏览器 prompt
  const globalWindow = typeof globalThis !== 'undefined' ? globalThis : {};
  const promptFn = (globalWindow as { prompt?: (message?: string) => string | null }).prompt;
  if (!promptFn) {
    return null;
  }
  const selection = promptFn(PICKER_TITLE);
  return normalizeWorkspaceSelection(selection);
};
