#!/usr/bin/env node

/**
 * 文件功能：CLI 入口点，负责处理命令行参数并启动应用程序
 *
 * 核心方法：
 * - main(): 主程序入口点，委托给 main.ts 中的 Application 类处理
 */

import { main } from './main';

// 运行主程序
main()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
