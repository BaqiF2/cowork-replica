/**
 * Mock IPC Service for Development Mode
 *
 * Provides a simulated IPC service that works in browser development mode
 * (without Tauri). This enables E2E testing and development without
 * requiring the full Tauri backend.
 *
 * Features:
 * - Simulates streaming responses
 * - Simulates tool use visualization
 * - Simulates thinking indicator
 * - Markdown message rendering support
 */

import type { ChatIPC } from '../stores/chatStore';

type Handler = (payload: unknown) => void;

/**
 * Simulated responses for different user inputs
 */
const MOCK_RESPONSES: Record<string, {
  thinking?: string;
  thinkingDuration?: number;
  tools?: Array<{ tool: string; args: Record<string, unknown>; result: string }>;
  response: string;
}> = {
  default: {
    thinking: '让我思考一下如何回答这个问题...',
    response: '你好！我是 Cowork 助手，很高兴为你服务。有什么我可以帮助你的吗？',
  },
  'hello, claude': {
    thinking: '用户在打招呼，我应该友好地回应...',
    response: '你好！我是 Claude，很高兴认识你。今天有什么可以帮到你的吗？',
  },
  'test thinking': {
    thinking: '这是一个测试思考内容...\n正在分析用户的请求...\n准备生成响应...',
    thinkingDuration: 5000,
    response: '思考测试完成！ThinkingIndicator 应该已经显示了思考内容。',
  },
  'read file': {
    thinking: '用户想要读取文件，我需要使用 Read 工具...',
    tools: [
      {
        tool: 'Read',
        args: { file_path: '/example/test.txt' },
        result: '文件内容示例：\nHello World!\n这是一个测试文件。',
      },
    ],
    response: '我已经读取了文件内容。文件包含一些测试文本。',
  },
  'show markdown': {
    response: `# Markdown 示例

这是一个 **粗体** 和 *斜体* 文本的示例。

## 代码块

\`\`\`typescript
function hello(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## 列表

- 项目 1
- 项目 2
- 项目 3

## 链接

[Anthropic](https://www.anthropic.com)
`,
  },
};

/**
 * Create a mock IPC service for development mode
 */
export function createMockIpcService(): ChatIPC & {
  trigger: (event: string, payload: unknown) => void;
  simulateResponse: (userMessage: string) => void;
} {
  const handlers = new Map<string, Set<Handler>>();

  const on: ChatIPC['on'] = (event, handler) => {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler as Handler);
  };

  const off: ChatIPC['off'] = (event, handler) => {
    const set = handlers.get(event);
    if (set) {
      set.delete(handler as Handler);
    }
  };

  const trigger = (event: string, payload: unknown) => {
    const set = handlers.get(event);
    if (!set) {
      return;
    }
    for (const handler of set) {
      handler(payload);
    }
  };

  /**
   * Simulate a response from the assistant
   */
  const simulateResponse = (userMessage: string) => {
    const normalizedMessage = userMessage.toLowerCase().trim();
    const mockData = MOCK_RESPONSES[normalizedMessage] ?? MOCK_RESPONSES.default;
    const thinkingDuration = mockData.thinkingDuration ?? 1500;

    // Start computing indicator
    trigger('display_computing', {});

    // Simulate thinking (if available)
    if (mockData.thinking) {
      setTimeout(() => {
        trigger('display_thinking', { content: mockData.thinking });
      }, 200);

      // Clear thinking after a delay
      setTimeout(() => {
        trigger('display_thinking', { content: null });
      }, thinkingDuration);
    }

    // Simulate tool uses (if available)
    if (mockData.tools) {
      mockData.tools.forEach((toolData, index) => {
        setTimeout(() => {
          trigger('display_tool_use', {
            tool: toolData.tool,
            args: toolData.args,
          });

          // Simulate tool result after a delay
          setTimeout(() => {
            trigger('display_tool_result', {
              tool: toolData.tool,
              result: toolData.result,
              isError: false,
            });
          }, 800);
        }, 1800 + index * 1200);
      });
    }

    // Simulate assistant response
    const responseDelay = mockData.tools
      ? 1800 + mockData.tools.length * 1200 + 1000
      : Math.max(thinkingDuration + 500, 2000);

    setTimeout(() => {
      trigger('display_message', {
        message: mockData.response,
        role: 'assistant',
      });

      // Stop computing indicator
      trigger('stop_computing', {});
    }, responseDelay);
  };

  const emit: ChatIPC['emit'] = async (event: string, payload: unknown) => {
    console.log(`[MockIPC] Emit: ${event}`, payload);

    if (event === 'user_message') {
      const { message } = payload as { message: string };
      // Simulate async response
      setTimeout(() => {
        simulateResponse(message);
      }, 100);
    }

    return Promise.resolve();
  };

  return {
    on,
    off,
    emit,
    trigger,
    simulateResponse,
  };
}

/**
 * Check if running in Tauri context
 */
export function isTauriContext(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Singleton mock IPC service instance
 */
let mockIpcInstance: ReturnType<typeof createMockIpcService> | null = null;

/**
 * Get or create the mock IPC service instance
 */
export function getMockIpcService(): ReturnType<typeof createMockIpcService> {
  if (!mockIpcInstance) {
    mockIpcInstance = createMockIpcService();
  }
  return mockIpcInstance;
}
