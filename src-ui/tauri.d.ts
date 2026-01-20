/**
 * Type declarations for @tauri-apps/api
 *
 * These declarations allow TypeScript to compile the ipcService
 * without requiring the actual @tauri-apps/api package to be installed.
 * In production, the real @tauri-apps/api package will be used.
 */

declare module '@tauri-apps/api/core' {
  export function invoke(cmd: string, args?: Record<string, unknown>): Promise<unknown>;
}

declare module '@tauri-apps/api/event' {
  export type UnlistenFn = () => void;
  export function listen<T>(
    event: string,
    handler: (event: { payload: T }) => void
  ): Promise<UnlistenFn>;
}
